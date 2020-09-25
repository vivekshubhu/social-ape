const { admin, db} = require('./admin');

module.exports = (req, res, next) => {
    let tokenId;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
        tokenId = req.headers.authorization.split('Bearer ')[1];
    } else {
        return res.status(403).json({
            error: 'Unauthorized'
        });
    }

    admin.auth().verifyIdToken(tokenId)
        .then(function (decodedToken) {
            req.user = decodedToken;
            return db.collection(`/users`).where('userId', '==', req.user.uid).limit(1).get();
        })
        .then(data => {
            req.user.handle = data.docs[0].data().handle;
            return next();
        })
        .catch(function (error) {
            // Handle error
            return res.status(500).json(error);
        });

}
