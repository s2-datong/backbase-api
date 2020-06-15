const prodconfig = require('./production');
const devconfig = require('./development');
const testEnv = require('./test');

if(process.env.NODE_ENV && process.env.NODE_ENV === "production"){
    module.exports = prodconfig;
}
else if(process.env.NODE_ENV && (
    process.env.NODE_ENV === "development" || process.env.NODE_ENV === "staging")
    ){
    module.exports = devconfig;
}
else{
    module.exports = testEnv;
}