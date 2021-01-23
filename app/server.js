const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const expressfileupload = require('express-fileupload');
const config = require('../config');

const {ApplicationError} = require('./exceptions');
const {ValidationError} = require('express-validation');

const accountRouter = require('./routes/Account').Router;
const organizationRouter = require('./routes/Organization').Router;
const workspaceRouter = require('./routes/Workspace').Router;
const workspaceAdminRouter = require('./routes/WorkspaceAdmin').Router;
const rulesRouter = require('./routes/Rule').Router;
const channelRouter = require('./routes/Channel').Router;
const functionRouter = require('./routes/Functions').Router;
const variableRouter = require('./routes/Variables').Router;
const userRouter = require('./routes/User').Router;
const subscriptionRouter = require('./routes/Subscription').Router;
const PaymentRouter = require('./routes/FundingSource').Router;
const PollingJobRouter = require('./routes/PollingJob').Router;
const HealthRouter = require('./routes/Health').Router;

//const sentry = require('@sentry/node');
//sentry.init({dsn: config.service.sentry.dsn});

const app = express();
app.use(cors())
.use(bodyParser.json())
.use(expressfileupload());

app.use('/v1/account', accountRouter);
app.use('/v1/organization', organizationRouter);
app.use('/v1/workspace', workspaceRouter);
app.use('/v1/workspace_admin', workspaceAdminRouter);
app.use('/v1/rules', rulesRouter);
app.use('/v1/channel', channelRouter);
app.use('/v1/functions', functionRouter);
app.use('/v1/variables', variableRouter);
app.use('/v1/user', userRouter);
app.use('/v1/subscription', subscriptionRouter);
app.use('/v1/payments', PaymentRouter);
app.use('/v1/pollingjob', PollingJobRouter);
app.use('/v1/health', HealthRouter);

app.use(function(err, req, res, next) {
    if (err instanceof ValidationError) {
        return res.status(err.statusCode).json(err)
    }
    if(err instanceof ApplicationError){
        return res.status(err.statusCode).json({message: err.message, error_code: err.errCode});
    }

    console.error(err);
    //sentry.captureException(err);
    return res.status(500).write("Internal server error").end();
});

app.listen(3000, () => {
    console.log('server listening on 3000')
});
