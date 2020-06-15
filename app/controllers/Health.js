const {RedisService} = require('../services');
const {pingDB} = require('../db');
class Health{
    static async checkhealth(){
        //ping db, ping redis
        const redisPingResult = await RedisService.ping();
        const dbPingResult = await pingDB();
        return true;
    }
}

module.exports = Health;