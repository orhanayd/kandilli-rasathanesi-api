const express = require('express');
const router = express.Router();
const services = require('../../services');
const controller = require('../../controller');

/**
 * GET /deprem/afad/live
 * @param {number} skip.query - records to skip (0-10000, default 0)
 * @param {number} limit.query - max records (1-100, default 50; above 100 is capped)
 * @summary api earthquakes live endpoint from afad
 * @tags DEPREM LIST AFAD
 * @return {object} 200 - success response - application/json
 * @return {object} 422 - wrong param - application/json
 * @return {object} 500 - Server error - application/json
 */
router.get('/live', [controller.afad.live], services.afad.live);

/**
 * GET /deprem/afad/archive
 * @param {number} skip.query - records to skip (0-10000, default 0)
 * @param {number} limit.query - max records (1-100, default 50; above 100 is capped)
 * @param {string} date.query - start day YYYY-MM-DD, from 00:00:00 (default: 24 hours ago)
 * @param {string} date_end.query - end day YYYY-MM-DD, until 23:59:59 (default: now)
 * @summary api earthquakes archive endpoint from afad (newest first)
 * @tags DEPREM LIST AFAD
 * @return {object} 200 - success response - application/json
 * @return {object} 422 - wrong param - application/json
 * @return {object} 500 - Server error - application/json
 */
router.get('/archive', [controller.afad.archive], services.afad.archive);

module.exports = router;
