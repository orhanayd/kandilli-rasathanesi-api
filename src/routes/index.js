const express = require('express');
const router = express.Router();

const services = require('../services');
const controller = require('../controller');

const int = require('./int');
const kandilli = require('./kandilli');

router.use('/int', int);
router.use('/kandilli', kandilli);

/**
 *      !!!!  It has been added for compatibility for those using the old endpoint !!!!
 *      !!!! WILL BE DISABLED IN TIME !!!!
 */
router.get('/', [controller.kandilli.archive], services.kandilli.archive);
router.get('/live.php', [controller.kandilli.live], services.kandilli.live);
router.get('/index.php', [controller.kandilli.archive], services.kandilli.archive);

module.exports = router;