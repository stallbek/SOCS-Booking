// middleware/authMiddleware.js
// Authentication and authorization middleware

/*
checks session exists
reject the request if the user is not logged in
attach the user information to req.user
*/

function requireAuth(req, res, next) {
    if (!req.session || !req.session.userId) {
        return res.status(401).json({ error: 'Please log in to continue.' });
    }

    req.user = {
        id: req.session.userId,
        role: req.session.userRole,
        name: req.session.userName,
        email: req.session.userEmail
    };

    next();
}

/*
allow only owners
reject regular users
*/

function requireOwner(req, res, next) {
    if (!req.session || !req.session.userId) {
        return res.status(401).json({ error: 'Please log in to continue.' });
    }

    if (req.session.userRole !== 'owner') {
        return res.status(403).json({ error: 'Only @mcgill.ca users can perform this action.' });
    }

    req.user = {
        id: req.session.userId,
        role: req.session.userRole,
        name: req.session.userName,
        email: req.session.userEmail
    };

    next();
}

module.exports = { requireAuth, requireOwner };