const express = require('express');
const router = express.Router();
const services = require('../../services');
const middlewares = require('../../middlewares');

/**
 * GET /int/earthquakes
 * @summary api earthquakes save endpoint for cron
 * @tags INT
 * @security HeaderAuthCron
 * @return {object} 200 - success response - application/json
 * @return {object} 500 - Server error - application/json
 */
router.get('/earthquakes', [middlewares.cron], services.int.earthquakes);

module.exports = router;