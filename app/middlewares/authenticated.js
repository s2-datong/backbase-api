const JWT = require('jsonwebtoken');
const config = require('../../config');
const systemUserEmail = config.app.backbase_org.admin_user.email;
const {RedisService} = require('../services');
const {ObjectID} = require('mongodb')

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
        const token_id = token.token_id;
        const isValidToken = await RedisService.isValidToken(token.id, token_id);
        if(isValidToken === false){
            throw new Error("Invalid Session");
        }

        const user = {
            _id: new ObjectID(token.id),
            firstname: token.first_name,
            lastname: token.first_name,
            email: token.email,
            email_verified: token.verified,
            organization: new ObjectID(token.organization.id),
            orgname: token.organization.name,
            token_id: token.token_id
        };

        // skip billing for system users
        if(user.email === systemUserEmail) user.system = true;
        if(token.system && token.system === true) user.system = true;
        
        const orgTeamUser = {
            _id: new ObjectID(token.team_user.id),
            id: token.team_user.id,
            status: token.team_user.status,
            org_owner: token.team_user.org_owner,
            admin: token.team_user.admin
        };

        req.user = user;
        req.orgTeamUser = orgTeamUser;
        
        next();
    }
    catch(e){
        console.log(e)
        if(e instanceof JWT.TokenExpiredError){
            return res.status(401).json({message: "Session has expired. Please login again"})
        }

        return res.status(401).json({message: "Invalid Token. Please login again"});
    }
};