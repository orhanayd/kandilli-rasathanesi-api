const express = require('express');
const db = require('../db');
const router = express.Router();

const services = require('../services');
const controller = require('../controller');

const int = require('./int');
const kandilli = require('./kandilli');

router.use('/deprem/int', int);
router.use('/deprem/kandilli', kandilli);


/**
 * GET /deprem/status
 * @summary api STATUS
 * @tags INT
 * @return {object} 200 - success response - application/json
 * @return {object} 500 - Server error - application/json
 */
router.get('/deprem/status', async (req, res) => {
    return res.json(
        {
            status: true,
            desc: 'kandilli rasathanesi api service',
            nopeRedis: db.nopeRedis.stats({ showKeys: true, showTotal: true, showSize: true })
        }
    );
});

/**
 *      !!!!  It has been added for compatibility for those using the old endpoint !!!!
 *      !!!! WILL BE DISABLED IN TIME !!!!
 */
router.get('/deprem/', [controller.kandilli.archive], services.kandilli.archive);
router.get('/deprem/live.php', [controller.kandilli.live], services.kandilli.live);
router.get('/deprem/index.php', [controller.kandilli.archive], services.kandilli.archive);

module.exports = router;