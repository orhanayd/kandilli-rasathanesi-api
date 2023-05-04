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
        let key = 'data/stats/' + req.body.provider + '/' + req.body.range;
        if (req.body.match['location_properties.epiCenter.name']) {
            key += '/' + req.body.match['location_properties.epiCenter.name'];
        }
        const cache = db.nopeRedis.getItem(key);
        if (cache) {
            responseBody.result = cache;
            responseBody.httpStatus = 200;
        } else {
            responseBody.result = {
                dateBy: await repositories.data.stats.dateBy(req.body.match),
                hourBy: await repositories.data.stats.hourBy(req.body.match),
                epiCenterBy: await repositories.data.stats.epiCenterBy(req.body.match),
                airportsBy: await repositories.data.stats.airportsBy(req.body.match),
                magBy: await repositories.data.stats.magBy(req.body.match)
            };
            responseBody.httpStatus = 200;
            db.nopeRedis.setItem(key, responseBody.result, 5 * 60);
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