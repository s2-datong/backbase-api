const redis = require("redis");
const config = require('../../config');

const client = redis.createClient({
    host: config.service.redis.url,
    password: config.service.redis.password,
    db: 2
});
const util = require('util');
client.on('error', (e) => {
    if(e.code && e.code === "ECONNREFUSED"){
        console.error('Connection refused');
        process.exit(1);
    }
    console.error(e)
});

const lpushAsync = util.promisify(client.lpush).bind(client);
const ltrimAsync = util.promisify(client.ltrim).bind(client);
const deleteKeyAsync = util.promisify(client.del).bind(client);

async function setHash(hash, field, value){
    return new Promise((resolve, reject) => {
        client.hset(hash, field, value, (result) => {resolve(result)});
    });
}

async function setHashAll(...args){
    return new Promise((resolve, reject) => {
        client.hmset(...args, (result) => {resolve(result)});
    });
}

async function getHashAll(key){
    return new Promise((resolve, reject) => {
        client.hgetall(key, (error, data) => {
            if(error) return reject(error);
            return resolve(data);
        });
    });
}

async function incrementHash(key, field, amount){
    return new Promise((resolve, reject) => {
        client.HINCRBY(key, field, amount, (error, number) => {
            if(error) return reject(error);
            return resolve(number);
        });
    });
}

async function hashKeys(hash){
    return new Promise((resolve, reject) => {
        client.hkeys(hash, (error, result) => {
            if(error) return reject(error);
            return resolve(result);
        });
    });
}

async function deleteHash(hash, field){
    return new Promise((resolve, reject) => {
        client.HDEL(hash, field, (error, result) => {
            if(error) return reject(error);
            return resolve(result);
        });
    });
}

async function ListLength(key){
    return new Promise((resolve, reject) => {
        client.llen(key, (error, length) => {
            if(error) return reject(error);
            return resolve(length);
        });
    });
}

async function ListPush(key, value){
    return new Promise((resolve, reject) => {
        client.lpush(key, value, (error, result) => {
            if(error) return reject(error);
            return resolve(result);
        });
    });
}

async function ListSet(key, index, value){
    return new Promise((resolve, reject) => {
        client.lset(key, index, value, (error, result) => {
            if(error) return reject(error);
            return resolve(result);
        });
    });
}

async function AllItemsInList(key){
    return new Promise((resolve, reject) => {
        client.lrange(key, 0, -1, (error, result) => {
            if(error) return reject(error);
            return resolve(result);
        });
    });
}

async function ListDelete(key, index){
    await ListSet(key, index, '_DELETED');
    return new Promise((resolve, reject) => {
        client.lrem(key, 1, '_DELETED', (error, result) => {
            if(error) return reject(error);
            return resolve(result);
        });
    });
}

async function ListDeleteByValue(key, value){
    return new Promise((resolve, reject) => {
        client.lrem(key, 1, value, (error, result) => {
            if(error) return reject(error);
            return resolve(result);
        });
    });
}

async function ListDeleteAll(key){
    const vals = await AllItemsInList(key);
    if(vals == null) return;
    for(let i = 0; i < vals.length; i++){
        await ListDeleteByValue(key, vals[i]);
    }
}

function VerifyUsage(usage){
    if(usage !== 'user_count' && usage !== 'workspace_count'
    && usage !== 'polling_job_count' && usage !== 'variable_count'
    && usage !== 'function_count' && usage !== 'channel_count'
    && usage !== 'rule_count'){
        throw new Error('Invalid value for usage');
    }
}

function VerifyPlan(plan){
    if(plan !== 'free' && plan !== 'startup'
    && plan !== 'standard' && plan !== 'enterprise'){
        throw new Error('Invalid value for plan');
    }
}

class Redis{
    static async saveOrgAPIKey(org_id, api_key, isSubscribed = false){
        await setHashAll(api_key, 'org_id', org_id, 'subscribed', isSubscribed);
    }

    static async replaceAPIKey(org_id, old_api_key, new_api_key, isSubscribed = false){
        await deleteKeyAsync(old_api_key);
        await setHashAll(new_api_key, 'org_id', org_id, 'subscribed', isSubscribed);
    }

    static async saveNewOrganization(org_id){
        await setHashAll(org_id, 
            'current_plan', 'free',
            'user_count', 1,
            'workspace_count', 0,
            'polling_job_count', 0,
            'variable_count', 0,
            'function_count', 0,
            'channel_count', 0,
            'rule_count', 0);
    }

    static async getOrgUsage(org_id){
        const data = await getHashAll(org_id);
        return data;
    }

    static async incrementUsage(org_id, usage, measure = 1){
        VerifyUsage(usage);
        await incrementHash(org_id, usage, measure);
    }

    static async decrementUsage(org_id, usage, measure = -1){
        VerifyUsage(usage);
        await incrementHash(org_id, usage, measure);
    }

    static async updateOrgPlan(org_id, plan){
        VerifyPlan(plan);
        await setHash(org_id, 'current_plan', plan);
    }

    //functions
    static async saveWorkspaceFunction(org_id, workspace_id, functionName, entireFunctionDefinition){
        const key = `${org_id}_${workspace_id}_functions`;
        await setHash(key, functionName, entireFunctionDefinition);
    }

    static async deleteWorkspaceFunction(org_id, workspace_id, functionName){
        const key = `${org_id}_${workspace_id}_functions`;
        await deleteHash(key, functionName);
    }

    static async deleteAllWorkspaceFunctions(org_id, workspace_id){
        const key = `${org_id}_${workspace_id}_functions`;
        await deleteKeyAsync(key);
    }

    // variables
    static async saveWorkspaceVariable(org_id, workspace_id, variableName, value){
        const key = `${org_id}_${workspace_id}_variables`;
        await setHash(key, variableName, value);
    }

    static async deleteWorkspaceVariable(org_id, workspace_id, variableName){
        const key = `${org_id}_${workspace_id}_variables`;
        await deleteHash(key, variableName);
    }

    static async deleteAllWorkspaceVariables(org_id, workspace_id){
        const key = `${org_id}_${workspace_id}_variables`;
        await deleteKeyAsync(key);
    }

    static async getAllVariables(org_id, workspace_id){
        const key = `${org_id}_${workspace_id}_variables`;
        return await getHashAll(key);
    }

    // channels
    static async saveChannel(org_id, workspace_id, channel_slug){
        const key = `${org_id}_${channel_slug}`;
        await setHash(key, 'workspace_id', workspace_id);
    }

    static async deleteChannel(org_id, workspace_id, channel_slug){
        const key = `${org_id}_${channel_slug}`;
        await deleteKeyAsync(key);
    }

    // Rules

    static async saveChannelRule(org_id, workspace_id, channel_slug, rule, index){
        const key = `${org_id}_${channel_slug}_rules`;
        await setHash(key, index, rule);
    }

    static async deleteChannelRule(org_id, workspace_id, channel_slug, index){
        const key = `${org_id}_${channel_slug}_rules`;
        await deleteHash(key, index);
    }

    static async deleteAllChannelRules(org_id, workspace_id, channel_slug){
        const key = `${org_id}_${channel_slug}_rules`;
        await deleteKeyAsync(key);
    }

    // SESSION MANAGEMENT

    static async saveSessionToken(user_id, token_id){
        const key = `${user_id}_session`;
        await lpushAsync(key, token_id);
        await ltrimAsync(key, 0, 2);
    }

    static async isValidToken(user_id, token_id){
        const key = `${user_id}_session`;
        const items = await AllItemsInList(key);
        if(items.indexOf(token_id) !== -1) return true;
        return false;
    }

    static async removeToken(user_id, token_id){
        const key = `${user_id}_session`;
        await ListDeleteByValue(key, token_id);
    }

    static async clearAllSessions(user_id){
        const key = `${user_id}_session`;
        await ListDeleteAll(key);
    }

    // HEALTH
    static async ping(){
        const p = new Promise((resolve, reject) => {
            client.ping((result) => {
                resolve(result);
            })
        });

        const pong = await p;
        return;
    }

    static async stop(){
        if(!process.env.NODE_ENV) return;
        if(process.env.NODE_ENV !== 'test') return;
        client.flushall("ASYNC", () => {
            client.end(false);
        })
    }
}

module.exports = Redis;