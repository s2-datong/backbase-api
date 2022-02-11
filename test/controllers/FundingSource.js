// add card, add card, make 2nd card default, delete 1st card, list cards
// add bank, add bank, make second bank defaukt, delete first bank, list banks
// make 2nd card default again

const accountController = require('../../app/controllers/Account');
const fundingSourceController = require('../../app/controllers/FundingSource');
const subscriptionController = require('../../app/controllers/Subscription');

const {ApplicationError,FundingSourceRequiredException} = require('../../app/exceptions');
const assert = require('assert');
const {getCollection} = require('../../app/db');
const {DB_BANK, DB_CARDS, DB_AVAILABLE_SUBSCRIPTIONS} = require('../../app/Constants');
const ParseJWT = require('../../app/util/JWT');
const path = require('path');

const config = require('../../config');
const stripe = require('stripe')(config.service.payment.stripe.secret_key);


const session = {};

describe('Funding source', function(done){
    this.timeout(6000);
    before( function(done){
        accountController.login(
            "bbase_user1_test@mailinator.com",
            "new_password"
        ).then(login => {
            session.token = login.token;
            done();
        });
    });

    describe('Cards', function(){
        it('Cannot subscribe to startup plan without any cards', async function(){
            const {user, orgTeamUser } = await ParseJWT(session.token);
            await assert.rejects(
                subscriptionController.subscribeOrgToNewPlan(user, orgTeamUser, 'startup'),
                FundingSourceRequiredException
            );
        });

        it('should add a card to organization', async function(){
            const {user, orgTeamUser } = await ParseJWT(session.token);
            const cardToken = await stripe.tokens.create(
                {
                  card: {
                    number: '4242424242424242',
                    exp_month: 6,
                    exp_year: 2023,
                    cvc: '314',
                  },
                }
            );
            const token = cardToken.id;

            await assert.doesNotReject(
                fundingSourceController.addCard(user, orgTeamUser, token)
            );
        });

        it('should add another card to organization', async function(){
            const {user, orgTeamUser } = await ParseJWT(session.token); 
            const cardToken = await stripe.tokens.create(
                {
                  card: {
                    number: '5555555555554444',
                    exp_month: 6,
                    exp_year: 2023,
                    cvc: '314',
                  },
                }
            );
            const token = cardToken.id;

            await assert.doesNotReject(
                fundingSourceController.addCard(user, orgTeamUser, token)
            );
        });

        it('make second card default card', async function(){
            const {user, orgTeamUser } = await ParseJWT(session.token);
            const cardColl = await getCollection(DB_CARDS);
            const secondCard = await cardColl.findOne({last4: '4444'});

            await assert.doesNotReject(
                fundingSourceController.makeCardDefaultFundingSource(
                    user, orgTeamUser, secondCard._id.toString()
                )
            );
        });

        it('delete first card', async function(){
            const {user, orgTeamUser } = await ParseJWT(session.token);
            const cardColl = await getCollection(DB_CARDS);
            const firstCard = await cardColl.findOne({last4: '4242'});

            await assert.doesNotReject(
                fundingSourceController.deleteCard(
                    user, orgTeamUser, firstCard._id.toString()
                )
            );
        });

        it('list cards must return 1', async function(){
            const {user, orgTeamUser } = await ParseJWT(session.token);
            const cards = await fundingSourceController.listCards(user, orgTeamUser);
            if(Array.isArray(cards.cards) && cards.cards.length === 1){}
            else{ assert.fail('Expecting 1 card'); }
        });
    });
    /*
    Would have to generate plaid account tokens first
    find out if their api supports this
    describe('Banks', function(){
        it('should add a bank account to organization', async function(){
            const {user, orgTeamUser } = await ParseJWT(session.token);
            const bankToken = await stripe.tokens.create(
                {
                  bank_account: {
                    country: 'NORWAY',
                    currency: 'usd',
                    account_number: 'NO9386011117947',
                  }
                }
            );
            const token = bankToken.id;
            await assert.doesNotReject(
                fundingSourceController.addBank(user, orgTeamUser)
            );
        });

        it('should add another bank account to organization', async function(){
            const {user, orgTeamUser } = await ParseJWT(session.token);
        });

        it('make second bank account default account', async function(){
            const {user, orgTeamUser } = await ParseJWT(session.token);
        });

        it('delete first bank account', async function(){
            const {user, orgTeamUser } = await ParseJWT(session.token);
        });

        it('list bank accounts must return 1', async function(){
            const {user, orgTeamUser } = await ParseJWT(session.token);
        });
    });

    describe('Default source', function(){
        it('make card default source on stripe', async function(){
            const {user, orgTeamUser } = await ParseJWT(session.token);
        });
    });
    */
});