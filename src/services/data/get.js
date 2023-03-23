/* eslint-disable no-inner-declarations */
const helpers = require('../../helpers');
const db = require('../../db');
const repositories = require('../../repositories');

module.exports = async (req, res) => {
    let responseBody = {
        status: true,
        httpStatus: 404,
        serverloadms: helpers.date.moment.timestampMS(),
        desc: '',
        result: null
    };
    try {
        const key = 'data/earthquake/' + req.query.earthquake_id;
        const cache = db.nopeRedis.getItem(key);
        if (cache) {
            responseBody.result = cache;
            responseBody.httpStatus = 200;
        } else {
            const query = await repositories.data.get(req.query.earthquake_id);
            if (query) {
                responseBody.httpStatus = 200;
                responseBody.result = query;
            }
            db.nopeRedis.setItem(key, query, 60 * 60 * 24);
        }
    } catch (error) {
        console.error(error);
        responseBody.desc = error.message || '';
        responseBody.status = false;
        responseBody.httpStatus = 500;
    }
    responseBody.serverloadms = (helpers.date.moment.timestampMS() - responseBody.serverloadms);
    return res.status(responseBody.httpStatus).json(responseBody);
};