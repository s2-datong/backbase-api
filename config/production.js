const plaidENVs = require('plaid').environments;
module.exports = {
    db:{
        mongo:{
            url: process.env.MONGO_URL ? process.env.MONGO_URL : `mongodb://${process.env.MONGODB_USER}:${process.env.MONGODB_PASSWORD}@${process.env.MONGODB_HOST}:${process.env.MONGODB_PORT}`,
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
            url: process.env.BILLING_SERVICE || 'http://localhost:3800'
        },
        events: {
            url: process.env.EVENTS_SERVICE || 'http://localhost:5700'
        },
        sentry: {
            dsn: process.env.SENTRY_DSN || ''
        },
        job_scheduler: {
            url: process.env.JOB_SCHEDULER_SERVICE || 'http://localhost:3000'
        },
        redis: {
            url: process.env.REDIS_URL,
            password: process.env.REDIS_PASSWORD
        }
    }
};