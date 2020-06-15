const config = require('../../config');
const stripe = require('stripe')(config.service.payment.stripe.secret_key);
const plaid = require('plaid');
const {getCollection} = require('../db');
const {DB_BANK, DB_CARDS, DB_ORG} = require('../Constants');
const {ApplicationError, OperationNotAllowedException} = require('../exceptions');
const ObjectID = require('mongodb').ObjectID;

const plaidClient = new plaid.Client(
    config.service.payment.plaid.client_id,
    config.service.payment.plaid.secret,
    config.service.payment.plaid.public_key,
    config.service.payment.plaid.environment
);

class FundingSource{
    static async addCard(user, orgTeamUser, stripe_client_token){
        const orgColl = await getCollection(DB_ORG);
        const cardColl = await getCollection(DB_CARDS);

        // verify org team user admin
        if(orgTeamUser.admin === false) throw new OperationNotAllowedException();

        const _org = await orgColl.findOne({_id: user.organization});
        const org_stripe_customer_id = _org.stripe_customer;

        const cardsCount = await cardColl.countDocuments({organization: user.organization});

        const card = await stripe.customers.createSource( 
            org_stripe_customer_id,
            {source: stripe_client_token}
        );

        const _card = {
            organization: user.organization,
            addedBy: user._id,
            stripe_id: card.id,
            exp_month: card.exp_month,
            exp_year: card.exp_year,
            last4: card.last4,
            country: card.country,
            brand: card.brand,
            default: (cardsCount === 0),
            timestamp: new Date(),
            type: 'card'
        };

        await cardColl.insertOne(_card);
        return {message: 'Card successfully added'};
    }

    static async listCards(user, orgTeamUser){ 
        const orgColl = await getCollection(DB_ORG);
        const cardColl = await getCollection(DB_CARDS);

        const _cards = await cardColl.find({
            organization: user.organization
        }).sort({_id: -1}).toArray();

        const cards = _cards.map(card => ({
            id: card._id.toString(),
            brand: card.brand,
            country: card.country,
            last4: card.last4,
            exp_month: card.exp_month,
            exp_year: card.exp_year,
            is_default_card: card.default
        }));

        return {cards};
    }

    static async makeCardDefaultFundingSource(user, orgTeamUser, card_id){
        const orgColl = await getCollection(DB_ORG);
        const cardColl = await getCollection(DB_CARDS);

        // verify org team user admin
        if(orgTeamUser.admin === false) throw new OperationNotAllowedException();

        const _org = await orgColl.findOne({_id: user.organization});
        const org_stripe_customer_id = _org.stripe_customer;

        const card = await cardColl.findOne({
            _id: new ObjectID(card_id),
            organization: user.organization
        });

        if(!card) throw new ApplicationError("Invalid card selected");
        const card_stripe_id = card.stripe_id;

        await stripe.customers.update(org_stripe_customer_id, {
            default_source: card_stripe_id,
        });

        await cardColl.updateMany({organization: user.organization}, {$set: {default: false}});
        await cardColl.updateOne({_id: card._id}, {$set: {default: true}});

        return {message: 'Card saved as default funding source'};
    }

    static async deleteCard(user, orgTeamUser, card_id){
        const orgColl = await getCollection(DB_ORG);
        const cardColl = await getCollection(DB_CARDS);

        // verify org team user admin
        if(orgTeamUser.admin === false) throw new OperationNotAllowedException();

        const _org = await orgColl.findOne({_id: user.organization});
        const org_stripe_customer_id = _org.stripe_customer;

        const card = await cardColl.findOne({
            _id: new ObjectID(card_id),
            organization: user.organization
        });

        if(!card) throw new ApplicationError("Invalid Card selected");
        const card_stripe_id = card.stripe_id;

        await stripe.customers.deleteSource( org_stripe_customer_id, card_stripe_id);
        await cardColl.deleteOne({_id: card._id});

        return {message: 'Bank'}
    }

    static async addBank(user, orgTeamUser, plaid_client_token, plaid_account_id){
        const orgColl = await getCollection(DB_ORG);
        const bankColl = await getCollection(DB_BANK);

        const _org = await orgColl.findOne({_id: user.organization});
        const org_stripe_customer_id = _org.stripe_customer;

        // verify org team user admin
        if(orgTeamUser.admin === false) throw new OperationNotAllowedException();

        const bankAccountsCount = await bankColl.countDocuments({organization: user.organization});

        try{
            const token = await plaidClient.exchangePublicToken(plaid_client_token);
            const access_token = token.access_token;
            const _token = await plaidClient.createStripeToken(access_token, plaid_account_id);
            const stripe_bank_token = _token.stripe_bank_account_token;

            const bank = await stripe.customers.createSource( 
                org_stripe_customer_id,
                {source: stripe_bank_token}
            );

            const _bank = {
                organization: user.organization,
                addedBy: user._id,
                stripe_id: bank.id,
                bank_name: bank.bank_name,
                country: bank.country,
                account_name: bank.account_holder_name,
                default: (bankAccountsCount === 0),
                timestamp: new Date(),
                type: 'bank'
            };

            await bankColl.insertOne(_bank);
            return {message: 'Bank Account added'};
        }
        catch(e){
            // LOG to Sentry
            throw new ApplicationError("There was an error adding this bank account. Please try again");
        }
    }

    static async listBanks(user, orgTeamUser){
        const orgColl = await getCollection(DB_ORG);
        const bankColl = await getCollection(DB_BANK);

        const _banks = await bankColl.find({
            organization: user.organization
        }).sort({_id: -1}).toArray();

        const banks = _banks.map(bank => ({
            id: bank._id.toString(),
            bank_name: bank.bank_name,
            country: bank.country,
            account_name: bank.account_name,
            is_default_bank: bank.default
        }));

        return {banks};
    }

    static async makeBankDefaultFundingSource(user, orgTeamUser, bank_id){
        const orgColl = await getCollection(DB_ORG);
        const bankColl = await getCollection(DB_BANK);

        const _org = await orgColl.findOne({_id: user.organization});
        const org_stripe_customer_id = _org.stripe_customer;

        // verify org team user admin
        if(orgTeamUser.admin === false) throw new OperationNotAllowedException();

        const bank = await bankColl.findOne({
            _id: new ObjectID(bank_id),
            organization: user.organization
        });

        if(!bank) throw new ApplicationError("Invalid Bank selected");
        const bank_stripe_id = bank.stripe_id;

        await stripe.customers.update(org_stripe_customer_id, {
            default_source: bank_stripe_id,
        });

        await bankColl.updateMany({organization: user.organization}, {$set: {default: false}});
        await bankColl.updateOne({_id: bank._id}, {$set: {default: true}});

        return {message: 'Bank saved as default funding source'};
    }

    static async deleteBank(user, orgTeamUser, bank_id){
        const orgColl = await getCollection(DB_ORG);
        const bankColl = await getCollection(DB_BANK);

        // verify org team user admin
        if(orgTeamUser.admin === false) throw new OperationNotAllowedException();

        const _org = await orgColl.findOne({_id: user.organization});
        const org_stripe_customer_id = _org.stripe_customer;

        const bank = await bankColl.findOne({
            _id: new ObjectID(bank_id),
            organization: user.organization
        });

        if(!bank) throw new ApplicationError("Invalid Bank selected");
        const bank_stripe_id = bank.stripe_id;

        await stripe.customers.deleteSource( org_stripe_customer_id, bank_stripe_id);
        await bankColl.deleteOne({_id: bank._id});

        return {message: 'Bank'}
    }
}

module.exports = FundingSource;