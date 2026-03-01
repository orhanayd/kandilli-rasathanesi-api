const express = require('express');
const db = require('../db');
const router = express.Router();

const repositories = require('../repositories');
const constants = require('../constants');
const controller = require('../controller');
const services = require('../services');

const kandilli = require('./kandilli');
const afad = require('./afad');
const statics = require('./statics');
const data = require('./data');

// Internal routes moved to separate service on port 7980
// router.use('/deprem/int', int);
router.use('/deprem/kandilli', kandilli);
router.use('/deprem/afad', afad);
router.use('/deprem/statics', statics);
router.use('/deprem/data', data);

/**
 * GET /deprem/status
 * @summary api STATUS
 * @tags INT
 * @return {object} 200 - success response - application/json
 * @return {object} 500 - Server error - application/json
 */
router.get('/deprem/status', async (_req, res) => {
	const response = constants.response();
	response.desc = 'kandilli son depremler api service';
	response.stats = await repositories.rate.stats();
	response.stats.total_banned_ip = await repositories.ban.count();
	response.nopeRedis = db.nopeRedis.stats({ showKeys: false, showTotal: true, showSize: true });
	return res.json(response);
});

/**
 * GET /deprem
 * @summary api ALL PROVIDERS (KANDILLI + AFAD)
 * @tags DATA
 * @param {number} skip.query - limit param limit
 * @param {number} limit.query - limit param limit
 * @param {string} date.query.required - date param YYYY-MM-DD
 * @param {string} date_end.query - date end param YYYY-MM-DD
 * @return {object} 200 - success response - application/json
 * @return {object} 500 - Server error - application/json
 */
router.get('/deprem', controller.data.allProviders, services.data.allProviders);

module.exports = router;
