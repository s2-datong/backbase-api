const HealthController = require('../controllers/Health');

const Router = require('express').Router;
const router = Router();

// health check
router.get('/', async (req, res) => {
    try{
        await HealthController.checkhealth();
        res.json({ok: true});
    }
    catch(e){
        console.error('Health check failed');
        console.error(e);
        res.status(500).json({ok: false});
    }
});

exports.Router = router;