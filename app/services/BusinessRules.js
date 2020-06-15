const config = require('../../config');
const {OperationNotAllowedException} = require('../exceptions');
const axios = require('axios');

const billing_url = config.service.billing.url;

class BusinessRules{ 
    static async RunThroughBackbase(payload){
        
        let result;
        try{
            result = await axios.post(billing_url, payload, {
                headers: {
                    'Content-Type': 'application/json'
                }
            });
        }
        catch(e){
            // what to do here, billing service is unreachable
        }

        if(result){
            const data = result.data;
            if(data && data.allowed && data.allowed === false){
                const errMessage = data.message;
                throw new OperationNotAllowedException(errMessage);
            }
        }
    }

    static async OrgUsageToBusinessRulesPayload(orgUsage){
        const payload = {
            current_plan: orgUsage.current_plan,
            users: orgUsage.user_count,
            workspace: orgUsage.workspace_count,
            polling_jobs: orgUsage.polling_job_count,
            variables: orgUsage.variable_count,
            functions: orgUsage.function_count,
            channels: orgUsage.channel_count,
            rules: orgUsage.rule_count,
        };

        return payload;
    }
}

module.exports = BusinessRules;