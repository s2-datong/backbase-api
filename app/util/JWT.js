const JWT = require('jsonwebtoken');
const config = require('../../config');
const {ObjectID} = require('mongodb');

module.exports = async (_token) => {
    try{ 
        const token = JWT.verify(_token, config.app.jwt.secret);
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
        if(token.system && token.system === true) user.system = true;
        
        const orgTeamUser = {
            _id: new ObjectID(token.team_user.id),
            id: token.team_user.id,
            status: token.team_user.status,
            org_owner: token.team_user.org_owner,
            admin: token.team_user.admin
        };
        return {user, orgTeamUser };
    }
    catch(e){
        throw e;
    }
};