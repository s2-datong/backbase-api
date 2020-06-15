const JWT = require('jsonwebtoken');
const config = require('../../config');
const systemUserEmail = config.app.backbase_org.admin_user.email;

module.exports = async (req, res, next) => {
    let apiKey = req.get('api-key');
    if(!apiKey) apiKey = req.get('authorization');
    if(!apiKey) return res.status(401).json({message: "Authentication Required"});

    if(apiKey.indexOf("Bearer") !== -1){
        apiKey = apiKey.replace("Bearer", "");
    }

    if(apiKey.indexOf("bearer") !== -1){
        apiKey = apiKey.replace("bearer", "");
    }

    if(apiKey.indexOf("jwt") !== -1){
        apiKey = apiKey.replace("jwt", "");
    }

    apiKey = apiKey.trim();
    try{
        const token = JWT.verify(apiKey, config.app.jwt.secret);
        const user = {
            _id: new ObjectID(token.id),
            firstname: token.first_name,
            lastname: token.first_name,
            email: token.email,
            email_verified: token.verified,
            organization: new ObjectID(token.organization.id)
        };

        // skip billing for system users
        if(user.email === systemUserEmail) user.system = true;
        if(token.system && token.system === true) user.system = true;
        
        const orgTeamUser = {
            _id: new ObjectID(token.team.id),
            id: token.team.id,
            status: token.team.status,
            org_owner: token.team.org_owner,
            admin: token.team.admin
        };

        req.user = user;
        req.orgTeamUser = orgTeamUser;
        
        next();
    }
    catch(e){
        if(e instanceof JWT.TokenExpiredError){
            return next();
        }

        return next();
    }
};