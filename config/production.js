const plaidENVs = require('plaid').environments;
module.exports = {
    db:{
        mongo:{
            url: `mongodb://${process.env.MONGODB_USER}:${process.env.MONGODB_PASSWORD}@${process.env.MONGODB_HOST}:${process.env.MONGODB_PORT}/${process.env.MONGODB_DB}`,
            db_name: process.env.MONGODB_DB
        }
    },
    app: {
        default_user_photo: 'https://res.cloudinary.com/dtrdr2o5x/image/upload/v1524469318/profile-placeholder_tc3jqb.jpg',
        default_org_logo: '',
        email: {
            days_token_valid: 2
        },
        jwt: {
            secret: process.env.JWT_SECRET || 'wewq8738743kj',
            expires: process.env.JWT_EXPIRES || '7d'
        },
        max_invite_emails: process.env.MAX_EMAIL_INVITES || 10,
        free_users: process.env.FREE_USERS || 2,
        backbase_org: {
            public_key: '940a9c43-34da-4f08-97bb-dec2ca714448',
            secret_key: '6a0c57ef-16ee-46bd-9bb4-feef15088a27',
            name: 'Backbase',
            admin_user: {
                first_name: 'Backbase',
                last_name: 'Admin',
                email: 'datong.samwul@gmail.com',
                password: 'password'
            }
        }
    },
    service: {
        email: {
            url: process.env.EMAIL_SERVICE || 'http://127.0.0.1:3001'
        },
        storage:{
            cloudinary: {
                cloud_name: 'dtrdr2o5x',
                api_key: '253151647295562',
                api_secret: 'tqZYJh2CVahXm4GdJHim0lLK8GY'
            }
        },
        payment: {
            default:'paystack',
            stripe:{
                secret_key: 'sk_test_OjJ2N2D7RNQrhN9m6pEzImX600HBrxPlyt',
                public_key: 'pk_test_5rTeHn1CbiBvk8r5tzLIJ6hi000mS9HryX'
            },
            paystack: {
                secret_key: '',
                public_key: '',
                trial_days: 14
            },
            plaid: {
                client_id: '5ea31527e3979600119f2419',
                public_key: '6a448c831b9acaee90719a43da5db7',
                secret: '737b115701748458fa6651ed1376d4',
                environment: plaidENVs.production
            },
            usd_price: 20,
            naira_price: 10000
        },
        billing: {
            url: process.env.BILLING_SERVICE || 'http://localhost:3800'
        },
        events: {
            url: process.env.EVENTS_SERVICE || 'http://localhost:5700'
        },
        sentry: {
            dsn: 'https://45b537fe5fa644c89a2ad6e674add5c3@o509731.ingest.sentry.io/5604660'
        },
        job_scheduler: {
            url: process.env.JOB_SCHEDULER_SERVICE || 'http://localhost:3000'
        }
    }
};