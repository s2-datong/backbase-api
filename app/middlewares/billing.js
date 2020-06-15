// call the billing service based on configured
// routes or actions that require billing confirmation
// if billing says action cannot be performed, return an error
// else continue
const {RedisService, BusinessRulesService} = require('../services');


module.exports = (action) => {
    if(action !== "add_user" && action !== "add_workspace"
    && action !== "add_channel" && action !== "add_rule"
    && action !== "add_function" && action !== "add_variable"
    && action !== "add_polling_job"){
        throw new Error("Invalid action key supplied");
    }

    return async (req, res, next) => {
        const _action = action;
        const user = req.user;
        const org_id = user.organization.toString();

        // if system user, user under backbase, skip billing
        if(user.system && user.system === true) return next();

        const orgUsage = await RedisService.getOrgUsage(org_id);
        orgUsage.action = _action;

        try{
            await BusinessRulesService.RunThroughBackbase(orgUsage);
            return next();
        }
        catch(e){
            res.status(401).json({message: e.message});
        }

    };
};