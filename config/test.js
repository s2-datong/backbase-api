const plaidENVs = require('plaid').environments;
module.exports = {
    db:{
        mongo:{
            url: 'mongodb://127.0.0.1:27017/BACKBASE_TEST',
            db_name: 'BACKBASE_TEST'
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
                cloud_name: process.env.CLOUDINARY_CLOUD_NAME || '',
                api_key: process.env.CLOUDINARY_API_KEY || '',
                api_secret: process.env.CLOUDINARY_API_SECRET || ''
            }
        },
        payment: {
            default:'paystack',
            stripe:{
                secret_key: process.env.STRIPE_SECRET_KEY || '',
                public_key: process.env.STRIPE_PUBLIC_KEY || ''
            },
            paystack: {
                secret_key: process.env.PAYSTACK_SECRET_KEY || '',
                public_key: process.env.PAYSTACK_PUBLIC_KEY || '',
                trial_days: 14
            },
            plaid: {
                client_id: process.env.PLAID_CLIENT_ID || '',
                public_key: process.env.PLAID_PUBLIC_KEY || '',
                secret: process.env.PLAID_SECRET || '',
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
            dsn: process.env.SENTRY_DSN || ''
        },
        job_scheduler: {
            url: 'http://localhost:3000'
        },
        redis: {
            url: process.env.REDIS_URL,
            password: process.env.REDIS_PASSWORD
        }
    }
};