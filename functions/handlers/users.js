const {
    db
} = require('../util/admin');
const config = require('../util/config');
const firebase = require('firebase');
const {
    signUpValidate,
    signinValidate,
    reduceUserDetails
} = require('../util/validator');

firebase.initializeApp(config);


//signup user
exports.signup = (request, response) => {
    const newUser = {
        email: request.body.email,
        password: request.body.password,
        confirmPassword: request.body.confirmPassword,
        handle: request.body.handle,
    }
    const {
        errors,
        valid
    } = signUpValidate(newUser);

    if (!valid) {
        return response.status(400).json(errors)
    }


    let token, userId;

    db.doc(`/users/${newUser.handle}`).get()
        .then(doc => {
            if (doc.exists) {
                return response.status(400).json({
                    handle: "hanlde already in use"
                });
            } else {
                return firebase.auth().createUserWithEmailAndPassword(newUser.email, newUser.password);
            }
        })
        .then(data => {
            userId = data.user.uid;
            return data.user.getIdToken();
        })
        .then(tokenId => {
            token = tokenId;
            const {
                handle,
                createdAt,
                email,
            } = {
                ...newUser
            };
            let userCredialtials = {
                handle,
                createdAt: new Date().toISOString(),
                email,
                userId
            }
            return db.doc(`users/${handle}`).set(userCredialtials);
        })
        .then(() => {
            return response.json({
                token
            });
        })
        .catch(function (error) {
            console.log(error);
            if (error.code === "auth/email-already-in-use") {
                return response.status(400).json({
                    error: "email is already in use"
                });
            } else return response.status(500).json({
                error: error.code
            });
        });
}




//add user details

exports.addUserDetails= (req, res) => {
    let userDetails = reduceUserDetails(req.body);

    db.doc(`users/${req.user.handle}`).update(userDetails)
    .then(() => {
        return res.status(200).json({message:"details updated successfully"});
    })
    .catch((error) => {
        return res.status(500).json({error:error.code});
    })

}


//get all data of auth user

exports.getAuthUserData = (req, res) => {
    let authUserData = {};
    db.doc(`users/${req.user.handle}`).get()
    .then((doc) => {
        if(doc.exists) authUserData.creadentails = doc.data();
        return db.collection('likes').where("userHandle", "==", req.user.handle ).get()
    })
    .then((data) => {
        authUserData.likes = [];
        data.forEach((doc) => {
            authUserData.likes.push(doc.data());
        })
        return db.collection('notifications').where("receipient", "==", req.user.handle)
            .orderBy("createdAt", "desc").limit(10).get()
    })
    .then((data) => {
        authUserData.notifications = [];
        data.forEach(doc => {
            authUserData.notifications.push({notificationId:doc.id, ...doc.data()});
        })
        return res.json(authUserData);
    })
    .catch((error) => {
        return res.status(500).json({error:error});
    })
}


//get any user details

exports.getUserDetails = (req, res) => {
    let userDetails;

    db.doc(`users/${req.params.userHandle}`).get()
        .then((doc) => {
            if(doc.exists) {
                userDetails = doc.data();
                return db.collection('screams').where('userHandle', '==', req.params.userHandle)
                .orderBy('createdAt', 'desc')
                .get();
            }
        })
        .then((data) => {
            userDetails.screams = [];
            data.forEach((doc) => {
                userDetails.screams.push({...doc.data(), screamId:doc.id});
            })
            return res.status(200).json(userDetails);
        })
        .catch((error) => {
            res.status(500).json(error);
        })
}


//signin user
exports.signin = (request, response) => {

    const {
        email,
        password
    } = {
        ...request.body
    }

    const {
        errors,
        valid
    } = signinValidate(email, password);

    if (!valid) {
        return response.status(400).json(errors)
    }


    firebase.auth().signInWithEmailAndPassword(email, password)
        .then((data) => {
            return data.user.getIdToken();
        })
        .then((token) => {
            return response.json({
                token
            });
        })
        .catch((error) => {
            if (error.code === "auth/invalid-email" || error.code === "auth/wrong-password" || error.code === "auth/user-not-found")
                return response.status(403).json({
                    general: "credentails doesnot match, please try again"
                });
            else
                return response.status(500).json({
                    error: error.code
                });
        })
}

//mark the notification to read

exports.markNotificationRead = (req, res) => {
    req.body.forEach((notificationId) => {
        db.doc(`/notifications/${notificationId}`).get()
        .then((doc) => {
            return doc.ref.update({read:true});
        })
        .then(() => {
            return res.status(200).json({message:"marked read"});
        })
        .catch((error) => {
            res.status(500).json({error:error});
        })
    })
}
