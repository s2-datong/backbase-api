const authenticatedMiddleware = require('../middlewares/authenticated');
const fundingSourceValidators = require('../input-validators/FundingSource');
const FundingSourceController = require('../controllers/FundingSource');

const Router = require('express').Router;
const router = Router();

router.post('/cards', 
[authenticatedMiddleware, fundingSourceValidators.addCardValidator], 
async (req, res) => {
    const resp = await FundingSourceController.addCard(
        req.user, req.orgTeamUser, req.body.token
    );
    return res.json(resp);
});

router.get('/cards', authenticatedMiddleware, async (req, res) => {
    const resp = await FundingSourceController.listCards(
        req.user, req.orgTeamUser
    );
    return res.json(resp);
});

router.put('/cards/default/:cardId', 
[authenticatedMiddleware, fundingSourceValidators.cardDefaultValidator], 
async (req, res) => {
    const resp = await FundingSourceController.makeCardDefaultFundingSource(
        req.user, req.orgTeamUser, req.params.cardId
    );
    return res.json(resp);
});

router.delete('/cards/:cardId', 
[authenticatedMiddleware, fundingSourceValidators.deleteCardValidator], 
async (req, res) => {
    const resp = await FundingSourceController.deleteCard(
        req.user, req.orgTeamUser, req.params.cardId
    );
    return res.json(resp);
});

router.post('/banks', 
[authenticatedMiddleware, fundingSourceValidators.addBankValidator], 
async (req, res) => {
    const resp = await FundingSourceController.addBank(
        req.user, req.orgTeamUser, req.body.token, req.body.account_id
    );
    return res.json(resp);
});

router.get('/banks', authenticatedMiddleware, async (req, res) => {
    const resp = await FundingSourceController.listBanks(
        req.user, req.orgTeamUser
    );
    return res.json(resp);
});

router.put('/banks/default/:bankId', 
[authenticatedMiddleware, fundingSourceValidators.bankDefaultValidator], 
async (req, res) => {
    const resp = await FundingSourceController.makeBankDefaultFundingSource(
        req.user, req.orgTeamUser, req.params.bankId
    );
    return res.json(resp);
});

router.delete('/banks/:bankId', 
[authenticatedMiddleware, fundingSourceValidators.deleteBankValidator], 
async (req, res) => {
    const resp = await FundingSourceController.deleteBank(
        req.user, req.orgTeamUser, req.params.bankId
    );
    return res.json(resp);
});

exports.Router = router;