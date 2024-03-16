const express = require('express');
const router = express.Router();
const services = require('../../services');
const controller = require('../../controller');
const middlewares = require('../../middlewares');

/**
 * DataSearchMatch defination
 * @typedef {object} DataSearchGeoNear
 * @property {number} lon.required - earthquake geonear longitude
 * @property {number} lat.required - earthquake geonear latitude
 * @property {number} radiusMeter - earthquake geonear search radiusMeter
 */

/**
 * DataSearchMatch defination
 * @typedef {object} DataSearchMatch
 * @property {number} mag - earthquake magnitude 
 * @property {string} date_starts - earthquake starts at YYYY-MM-DD HH:mm:ss
 * @property {string} date_ends - earthquake ends at YYYY-MM-DD HH:mm:ss
 * @property {number} cityCode - city code from statics/cities
 */

/**
 * data search defination
 * @typedef {object} DataSearch
 * @property {DataSearchMatch} match - match
 * @property {DataSearchGeoNear} geoNear - geoNeaer
 * @property {string} sort - sorting {date_1, date_-1, mag_1, mag_-1}
 * @property {number} skip - skip
 * @property {number} limit - limit
 */


/**
 * POST /deprem/data/search
 * @param {DataSearch} request.body.required - data search body
 * @summary api earthquakes search endpoint
 * @tags DATA
 * @return {object} 200 - success response - application/json
 * @return {object} 500 - Server error - application/json
 */
router.post('/search', [controller.data.search], services.data.search);


/**
 * GET /deprem/data/get
 * @param {string} earthquake_id.query - earthquake_id
 * @summary api earthquakes get endpoint
 * @tags DATA
 * @return {object} 200 - success response - application/json
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

module.exports = router;