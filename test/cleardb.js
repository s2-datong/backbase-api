const {setupDB, clearDB, closeDB} = require('../app/db');

(async () => {
    await setupDB();
    await clearDB();
    await closeDB();

    console.log('DB, cleared');
})();