const plaidENVs = require('plaid').environments;
module.exports = {
    db:{
        mongo:{
            url: 'mongodb://localhost:27017/BACKBASE',
            db_name: 'BACKBASE'
        }
    },
    app: {
        default_user_photo: 'https://res.cloudinary.com/dtrdr2o5x/image/upload/v1524469318/profile-placeholder_tc3jqb.jpg',
        default_org_logo: '',
        email: {
            days_token_valid: 2
        },
        jwt: {
            secret: 'wewq8738743kj',
            expires: '7d'
        },
        max_invite_emails: 10,
        free_users: 2,
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
            url: 'http://127.0.0.1:3001'
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
                environment: plaidENVs.sandbox
            }
        },
        billing: {
            url: 'http://localhost:3800'
        },
        events: {
            url: 'http://localhost:5700'
        },
        sentry: {
            dsn: ''
        },
        job_scheduler: {
            url: 'http://localhost:3000'
        }
    }
};