const { db } = require('../util/admin');

const {createNotificationOnLike, deleteNotificationOnUnlike, createNotificationOnComment, triggerOnDeleteScream} = require('../util/notification');

exports.getAllScreams =  (request, response) => {
    db.collection("screams").orderBy('createdAt', 'desc').get()
        .then((data) => {
            let screams = [];
            data.forEach((doc) => {
                screams.push({
                    ...doc.data(),
                    screamId: doc.id
                });
            });
            return response.json(screams);
        }).catch((err) => console.log(err));
}


exports.createScream = (request, response) => {
    const scream = {
        body: request.body.body,
        userHandle: request.user.handle,
        createdAt: new Date().toISOString(),
        likeCount:0,
        commentCount:0
    }

    db.collection("screams").add(scream)
        .then((docRef) => {
            return response.json({
                message: `scream ${docRef.id} created successfully`
            })
            // console.log("Document written with ID: ", docRef.id);
        })
        .catch((error) => {
            console.error(error);
            return response.status(500).json({
                error: "something went wrong",
                err: error
            })
        });
}


///get a scream

exports.getScream = (req, res) =>{
    let screamData = {};
    db.doc(`screams/${req.params.screamId}`).get()
    .then((doc) => {
        if(!doc.exists){
            return res.status(404).json({error:"scream doesnot exits"});
        }
        screamData = doc.data();
        screamData.screamId = doc.id;
        return db.collection("comments").where("screamId", "==", req.params.screamId).orderBy("createdAt", "desc").get();
    })
    .then((data) => {
        screamData.comments = [];
        data.forEach((doc) => {
            screamData.comments.push(doc.data());
        })
        return res.json(screamData);
    })
    .catch((error) => {
        return res.status(500).json({error:error});
    })
}

//comment on a scream

exports.commentOnScream = (req, res) => {

    if(req.body.body.trim() == ""){
        return res.status(400).json({error:"must not be empty"});
    }

    let newComment = {
        body:req.body.body,
        screamId:req.params.screamId,
        createdAt:new Date().toISOString(),
        userHandle:req.user.handle
    } 

    let screamDocument = db.doc(`screams/${req.params.screamId}`)

    screamDocument.get()
        .then((doc) => {
            if(!doc.exists) {
                return res.status(404).json({error:"scream doesnot exists"})
            }
            // doc.ref.update({commentCount : doc.data().commentCount + 1});
            return screamDocument.update({commentCount : doc.data().commentCount + 1})
        })
        .then(() => {
            return db.collection("comments").add(newComment);
        })
        .then((doc) => {
            return res.status(200).json(newComment);
        })
        .catch((error) => {
            return res.status(500).json({error:error});
        })

}


//like scream

exports.likeScream = (req, res) => {
    let likesDocument= db.collection("likes").where("screamId", "==", req.params.screamId)
            .where("userHandle", "==", req.user.handle).limit(1);

    let screamDocument = db.doc(`screams/${req.params.screamId}`)

    let screamData; 

    screamDocument.get()
        .then((doc) => {
            if(doc.exists){
                screamData = doc.data();
                screamData.screamId = doc.id;
                return likesDocument.get()
                
            }else{
                return res.status(404).json({error : "scream doesnot exist"});
            }
        })
        .then((data) => {
            if(data.empty){
                db.collection("likes").add({userHandle : req.user.handle, screamId : req.params.screamId})
                    .then((doc) => {
                        screamData.likeCount ++;
                        return screamDocument.update({likeCount : screamData.likeCount});
                    })
            }else{
              return res.json({message : "scream is already liked"})
            }
        })
        .then(() => {
            return res.json(screamData);
        })
        .catch((error) => {
            return res.status(500).json({error:error});
        })

}





//unlike scream

exports.unLikeScream = (req, res) => {
    let likesDocument= db.collection("likes").where("screamId", "==", req.params.screamId)
            .where("userHandle", "==", req.user.handle).limit(1);

    let screamDocument = db.doc(`screams/${req.params.screamId}`)

    let screamData; 

    screamDocument.get()
        .then((doc) => {
            if(doc.exists){
                screamData = doc.data();
                screamData.screamId = doc.id;
                return likesDocument.get()
                
            }else{
                return res.status(404).json({error : "scream doesnot exist"});
            }
        })
        .then((data) => {
            if(data.empty){
                return res.json({message : "scream never been liked"})
            }else{
                db.doc(`likes/${data.docs[0].id}`).delete()
                    .then(() => {
                        screamData.likeCount -- ;
                        return screamDocument.update({likeCount : screamData.likeCount});
                    })
            }
        })
        .then(() => {
            return res.json(screamData);
        })
        .catch((error) => {
            return res.status(500).json({error:error});
        })

}



//delete a scream

exports.deleteScream = (req, res) => {

    let screamDocument = db.doc(`/screams/${req.params.screamId}`);
    let screamId;
        screamDocument.get()
        .then((doc) => {
            if(!doc.exists){
                return res.status(404).json({error:"scream doesnot exists"});
            }
            if(req.user.handle !== doc.data().userHandle){
                return res.status(403).json({error:"unauthorized"});
            }else{
                screamId = doc.id;
                return screamDocument.delete();
            }
        })
        .then(() => {
            triggerOnDeleteScream(screamId);
            return res.status(200).json({message:"scream deleted successfully"});
        })
        .catch((error) => {
            return res.status(500).json({error:error});
        })

}
