const {closeDB, setupDB} = require('../app/db');
const {RedisService} = require('../app/services');
const Bootstrap = require('../app/controllers/Bootstrap');

before(async function() {
    this.timeout(10000);
    await setupDB();
    await Bootstrap.runBootstrap();
});

after(async function(){
    await closeDB();
    await RedisService.stop();
});