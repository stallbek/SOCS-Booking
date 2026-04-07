//middleware/auth.js
// Authentication and authorization middleware


// Ensuring the user is logged in
function requireAuth(req, res, next) {
    if (!req.session || !req.session.userID){
        return res.status(401).json({ error: 'Please log in to continue.'});
    }
    next();
}

//Making sure the user is an owner with a @mcgill.ca suffix
function requireOwner(req, res, next){
    if (!req.session || !req.session.userID){
        return res.status(401).json({error : 'Please log in to continue. '});
    }
    if (req.session.userRole !== owner){
        return res.status(403).json({ error : 'Only @mcgill.ca users can perform this action. '});
    }
    next();
}

module.exports = { requireAuth, requireOwner};