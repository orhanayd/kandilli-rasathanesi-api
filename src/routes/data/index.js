const express = require('express');
const router = express.Router();
const services = require('../../services');
const controller = require('../../controller');

/**
 * DataSearchMatch defination
 * @typedef {object} DataSearchGeoNear
 * @property {number} lon.required - earthquake geonear longitude
 * @property {number} lat.required - earthquake geonear latitude
 * @property {number} maxDistance - earthquake geonear search max distance
 */

/**
 * DataSearchMatch defination
 * @typedef {object} DataSearchMatch
 * @property {number} mag - earthquake magnitude 
 * @property {string} date_starts - earthquake starts at YYYY-MM-DDS
 * @property {string} date_ends - earthquake ends at YYYY-MM-DD
 * @property {number} cityCode - city code from statics/cities
 */

/**
 * data search defination
 * @typedef {object} DataSearch
 * @property {DataSearchMatch} match - match
 * @property {DataSearchGeoNear} geoNeear - geoNeaer
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

module.exports = router;