const {MongoClient} = require('mongodb');
const config = require('../../config');

let client = null;
let db = null;

exports.setupDB = async function setup(){
    console.log(config.db.mongo.url);
    try{
        client = new MongoClient(config.db.mongo.url, {useNewUrlParser: true, useUnifiedTopology: true});
        await client.connect();
        db = client.db(config.db.mongo.db_name);
    }
    catch(e){
        console.error(e);
    }
}

//setup();

exports.getCollection = async (name) => {
    if(client == null){
        client = new MongoClient(config.db.mongo.url, {useNewUrlParser: true, useUnifiedTopology: true});
        await client.connect();

        db = client.db(config.db.mongo.db_name);
    }

    const collection = db.collection(name);
    return collection;
}

exports.closeDB = async () => {
    if(client !== null){
        await client.close(true);
    }
}

exports.pingDB = async () => {
    const adminDb = db.admin();
    const result = await adminDb.ping();
    return result;
}

exports.clearDB = async () => {
    if(!process.env.NODE_ENV) return;
    if(process.env.NODE_ENV !== 'test') return;
    
    await db.collection("users").deleteMany({});
    await db.collection("organization").deleteMany({});
    await db.collection("organization_teams").deleteMany({});
    await db.collection("email_verification").deleteMany({});
    await db.collection("subscriptions").deleteMany({});
    await db.collection("forgot_password").deleteMany({});
    await db.collection("available_subscriptions").deleteMany({});
    await db.collection("subscription_plans").deleteMany({});
    await db.collection("invitations").deleteMany({});
    await db.collection("bank_accounts").deleteMany({});
    await db.collection("bank_cards").deleteMany({});
    await db.collection("rules").deleteMany({});
    await db.collection("channels").deleteMany({});
    await db.collection("workspace").deleteMany({});
    await db.collection("workspace_members").deleteMany({});
    await db.collection("workspace_variables").deleteMany({});
    await db.collection("workspace_functions").deleteMany({});
    await db.collection("polling_jobs").deleteMany({});
}