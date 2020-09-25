const functions = require('firebase-functions');
const express = require('express');
const app = express();
const {db} = require('./util/admin');

const { getAllScreams, createScream, getScream, commentOnScream, likeScream, unLikeScream, deleteScream } = require('./handlers/screams');
const{ signup, signin, addUserDetails, getAuthUserData, getUserDetails, markNotificationRead } = require('./handlers/users');

const FBAuth = require('./util/FBAuth');
const { reduceUserDetails } = require('./util/validator');

//screams routes
app.get('/screams', getAllScreams);
app.post('/scream', FBAuth, createScream);
app.get('/scream/:screamId', getScream);
app.post('/scream/:screamId/comment', FBAuth, commentOnScream);
app.get('/scream/:screamId/like', FBAuth, likeScream);
app.get('/scream/:screamId/unlike', FBAuth, unLikeScream);
app.delete('/scream/:screamId', FBAuth, deleteScream);

//users routes
app.post('/signup', signup);
app.post('/signin',signin);
app.post('/user', FBAuth, addUserDetails);
app.get('/user', FBAuth, getAuthUserData);
app.get('/user/:userHandle', getUserDetails);
app.post('/notifications', FBAuth, markNotificationRead);

exports.api = functions.https.onRequest(app);

exports.createNotificationOnComment = functions.firestore.document('comments/{id}')
    .onCreate((snap, context) => {
        db.doc(`screams/${snap.data().screamId}`).get()
        .then((doc) => {
            console.log(doc.data());
            if(doc.exists && doc.data().userHandle !== snap.data().userHandle){
                // console.log(doc.data().userHandle);
                return db.collection('notifications').doc(snap.id).set({
                    createdAt:new Date().toISOString(),
                    screamId:doc.id,
                    receipient:doc.data().userHandle,
                    sender:snap.data().userHandle,
                    type:"comment",
                    read:false
                })
            }
        })
        .then(() => {
            return;
        })
        .catch((error) => {
            console.log(error);
            return res.status(500).json({error:error});
        })
    });

    exports.createNotificationOnLike = functions.firestore.document('likes/{id}')
        .onCreate((snap) => {
            db.doc(`screams/${snap.data().screamId}`).get()
                .then((doc) => {
                    if(doc.exists && doc.data().userHandle !== snap.data().userHandle){
                        return db.collection('notifications').doc(snap.id).set({
                            screamId:doc.id,
                            receipient:doc.data().userHandle,
                            sender:snap.data().userHandle,
                            type:"like",
                            read:false,
                            createdAt:new Date().toISOString(),
                        })
                    }
                })
                .catch((error) => {
                    console.log(error);
                    return;
                })
        })

    exports.deleteNotificationOnUnlike = functions.firestore.document('like/{id}')
        .onDelete((snap) => {
            db.doc(`notifications/${snap.id}`)
            .delete()
            .then(() => {
                return;
            })
            .catch((err) => {
                console.log(err);
                return;
            })
        })