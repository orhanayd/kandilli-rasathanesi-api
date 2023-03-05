const express = require('express');
const router = express.Router();
const services = require('../../services');

/**
 * GET /deprem/statics/cities
 * @summary cities endpoint
 * @tags STATICS
 * @security HeaderAuthCron
 * @return {object} 200 - success response - application/json
 * @return {object} 500 - Server error - application/json
 */
router.get('/cities', services.statics.cities);

module.exports = router;