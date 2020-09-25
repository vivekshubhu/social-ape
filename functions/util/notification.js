const { db } = require('./admin');

// exports.createNotificationOnLike = (screamId, likeId, likeUserHandle) => {
//       db.doc(`screams/${screamId}`).get()
//         .then((doc) => {
//             if(doc.exists && doc.data().userHandle !== likeUserHandle){
//                 return db.collection('notifications').doc(likeId).set({
//                     screamId:doc.id,
//                     receipient:doc.data().userHandle,
//                     sender:likeUserHandle,
//                     type:"like",
//                     read:false,
//                     createdAt:new Date().toISOString(),
//                 })
//             }
//         })
//         .catch((error) => {
//             console.log(error);
//             return;
//         })
//     }

// exports.deleteNotificationOnUnlike = (likeId) => {
//     db.doc(`notifications/${likeId}`).delete()
//     .then(() => {
//         return;
//     })
//     .catch((error) => {
//         console.log(error);
//         return;
//     })
// }

// exports.createNotificationOnComment = (screamId, commentId, commentUserHandle) => {
//     console.log(screamId);
//       db.doc(`screams/${screamId}`).get()
//         .then((doc) => {
//             console.log(doc.data());
//             if(doc.exists && doc.data().userHandle !== commentUserHandle){
//                 console.log(doc.data().userHandle);
//                 return db.collection('notifications').doc(commentId).set({
//                     createdAt:new Date().toISOString(),
//                     screamId:doc.id,
//                     receipient:doc.data().userHandle,
//                     sender:commentUserHandle,
//                     type:"comment",
//                     read:false
//                 })
//             }
//         })
//         .then(() => {
//             return;
//         })
//         .catch((error) => {
//             console.log(error);
//             return res.status(500).json({error:error});
//         })
// }

exports.triggerOnDeleteScream = (screamId) => {
    db.collection('/comments').where('screamId', '==', screamId).get()
        .then((data) => {
            data.forEach((doc) => {
                if(doc.exists) {
                 doc.ref.delete();
                }
            })
            return db.collection('/notifications').where('screamId', '==', screamId).get()
        })
        .then((data) => {
            data.forEach((doc) => {
                if(doc.exists) {
                    doc.ref.delete();
                }
            })
            return db.collection('/likes').where('screamId', '==', screamId).get()

        })
        .then((data) => {
            data.forEach((doc) => {
                if(doc.exists) {
                   return doc.ref.delete();
                }
            })
        })
}