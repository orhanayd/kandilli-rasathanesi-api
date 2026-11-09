const express = require('express');
const router = express.Router();
const services = require('../../services');
const controller = require('../../controller');
const middlewares = require('../../middlewares');

/**
 * DataSearchGeoNear defination - optional; if sent, all three fields are required.
 * Area filter only: results are not ordered by distance (use sort).
 * @typedef {object} DataSearchGeoNear
 * @property {number} lon.required - longitude (-180 to 180)
 * @property {number} lat.required - latitude (-90 to 90)
 * @property {number} radiusMeter.required - search radius in meters (1 to 20000000)
 */

/**
 * DataSearchMatch defination
 * @typedef {object} DataSearchMatch
 * @property {number} mag - minimum magnitude (>=), decimals allowed
 * @property {string} date_starts - from YYYY-MM-DD HH:mm:ss (send together with date_ends)
 * @property {string} date_ends - until YYYY-MM-DD HH:mm:ss (send together with date_starts)
 * @property {number} cityCode - epicenter cityCode from statics/cities
 */

/**
 * data search defination
 * @typedef {object} DataSearch
 * @property {string} provider - kandilli | afad (default: all providers)
 * @property {DataSearchMatch} match - filters
 * @property {DataSearchGeoNear} geoNear - location filter
 * @property {string} sort - date_1, date_-1, mag_1, mag_-1 (default: date_-1)
 * @property {number} skip - records to skip (0-10000, default 0)
 * @property {number} limit - max records (1-100, default 10; above 100 is capped)
 */

/**
 * POST /deprem/data/search
 * @param {DataSearch} request.body.required - data search body
 * @summary api earthquakes search endpoint
 * @tags DATA
 * @return {object} 200 - success response - application/json
 * @return {object} 422 - wrong param - application/json
 * @return {object} 500 - Server error - application/json
 */
router.post('/search', [controller.data.search], services.data.search);

/**
 * GET /deprem/data/get
 * @param {string} earthquake_id.query.required - earthquake_id (13 characters)
 * @summary api earthquakes get endpoint
 * @tags DATA
 * @return {object} 200 - success response (no result field if the id is unknown) - application/json
 * @return {object} 406 - earthquake_id missing - application/json
 * @return {object} 500 - Server error - application/json
 */
router.get('/get', [controller.data.get], services.data.get);

/**
 * data statsGeneral defination
 * @typedef {object} DataStatsGeneral
 * @property {string} range - range
 * @property {string} provider - kandilli / afad
 */

/**
 * POST /deprem/data/stats/general
 * @param {DataStatsGeneral} request.body.required - data stats/general body
 * @summary api earthquakes statsGeneral endpoint
 * @security HeaderAuthStats
 * @tags DATA
 * @return {object} 200 - success response - application/json
 * @return {object} 500 - Server error - application/json
 */
router.post('/stats/general', [middlewares.stats, controller.data.statsGeneral], services.data.statsGeneral);

/**
 * GET /deprem/data/sitemap
 * @param {number} page.query - page number (default 1)
 * @param {number} limit.query - items per page (1-10000, default 5000)
 * @summary sitemap data endpoint with pagination
 * @security HeaderAuthStats
 * @tags DATA
 * @return {object} 200 - success response - application/json
 * @return {object} 500 - Server error - application/json
 */
router.get('/sitemap', [middlewares.stats, controller.data.sitemap], services.data.sitemap);

/**
 * GET /deprem/data/sitemap/count
 * @summary sitemap total count endpoint
 * @security HeaderAuthStats
 * @tags DATA
 * @return {object} 200 - success response - application/json
 * @return {object} 500 - Server error - application/json
 */
router.get('/sitemap/count', [middlewares.stats], services.data.sitemapCount);

module.exports = router;
