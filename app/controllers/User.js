const {getCollection} = require('../db');
const {ApplicationError} = require('../exceptions');
const crypto = require('crypto');
const jsonwebtoken = require('jsonwebtoken');
const config = require('../../config');
const ObjectID = require('mongodb').ObjectID;
const {DB_ORG, DB_USER } = require('../Constants');
const {StorageService} = require('../services');

class User{
    static async profile(user, orgTeamUser){
        // get profile
        const orgColl = await getCollection(DB_ORG);
        const userColl = await getCollection(DB_USER);

        const org = await orgColl.findOne({_id: user.organization});

        const _user = await userColl.findOne({_id: user._id});

        return {
            profile: {
                first_name: user.firstname,
                last_name: user.lastname,
                email: user.email,
                photo: _user.photo.url,
                email_verified: user.email_verified,
                organization: {
                    id: org._id.toString(),
                    name: org.name
                }
            }
        };
    }

    static async updateProfile(user, orgTeamUser, firstname, lastname, current_password, new_password, files){
        const userColl = await getCollection(DB_USER);
        let toUpdate = false;

        let sett = {$set: {}};
        if(firstname != null && firstname != '') sett.$set.firstname = firstname; toUpdate = true;
        if(lastname != null && lastname != '') sett.$set.lastname = lastname; toUpdate = true;

        if(current_password != null && new_password != null
            && current_password != '' && new_password != ''){
                const hash = crypto.createHash('SHA256');
                hash.update(current_password);
                const current_password_hash = hash.digest('hex');

                const hash2 = crypto.createHash('SHA256');
                hash2.update(new_password);
                const new_password_hash = hash2.digest('hex');

                const _user = await userColl.findOne({_id: user._id, password: current_password_hash});
                if(!_user) throw new ApplicationError("Invalid Current password provided");

                toUpdate = true;
                sett.$set.password = new_password_hash;
            }

        if(files && files.photo){
            if(files.photo.truncated === true) throw new ApplicationError('Image too large');
            const resp = await StorageService.Upload(files.photo.tempFilePath);
            sett.$set.photo = {
                url: resp.url,
                id: resp.public_id
            };
            const _user = await userColl.findOne({_id: user._id});
            if(_user.photo.id !== 'none'){
                // I have updated my photo before
                await StorageService.delete(_user.photo.id);
            }
            toUpdate = true;
        }

        if(toUpdate === true){
            await userColl.updateOne({_id: user._id}, sett);
        }


        return {message: 'Profile Updated successfully'}
    }

    static async refreshToken(user, orgTeamUser){
        // return new jwt with extended expiry date
        const userColl = await getCollection(DB_USER);
        const orgColl = await getCollection(DB_ORG);
        
        const _user = await userColl.findOne({_id: user._id});
        const _org = await orgColl.findOne({_id: user.organization});

        const usDetail = {
            id: _user._id.toString(),
            first_name: _user.firstname,
            last_name: _user.lastname,
            email: _user.email,
            verified: _user.email_verified,
            photo: _user.photo.url,
            organization: {
                id: _org._id.toString(),
                name: _org.name
            }
        };

        const jwtUser = {...usDetail};
        jwtUser.team_user = {
            id: orgTeamUser._id.toString(),
            status: orgTeamUser.status,
            org_owner: orgTeamUser.org_owner,
            admin: orgTeamUser.admin
        };

        const token = jsonwebtoken.sign(jwtUser, config.app.jwt.secret, {expiresIn: config.app.jwt.expires});
        return {user: usDetail, token};
    }

}

module.exports = User;