const express = require('express');
const router = express.Router();
const services = require('../../services');
const controller = require('../../controller');

/**
 * GET /kandilli/live
 * @param {number} limit.query - limit param limit
 * @summary api earthquakes live endpoint from kandilli
 * @tags KANDILLI
 * @return {object} 200 - success response - application/json
 * @return {object} 500 - Server error - application/json
 */
router.get('/live', [controller.kandilli.live], services.kandilli.live);

/**
 * GET /kandilli/archive
 * @param {number} limit.query - limit param limit
 * @param {string} date.query.required - date param YYYY-MM-DD
 * @summary api earthquakes archive endpoint from kandilli
 * @tags KANDILLI
 * @return {object} 200 - success response - application/json
 * @return {object} 500 - Server error - application/json
 */
router.get('/archive', [controller.kandilli.archive], services.kandilli.archive);

module.exports = router;