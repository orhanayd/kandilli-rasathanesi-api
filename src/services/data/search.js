/* eslint-disable no-inner-declarations */
const helpers = require('../../helpers');
const repositories = require('../../repositories');

module.exports = async (req, res) => {
    let responseBody = {
        status: true,
        httpStatus: 200,
        serverloadms: helpers.date.moment.timestampMS(),
        desc: '',
        result: {}
    };
    try {
        const data = await repositories.data.search(
            req.body.match,
            req.body.geoNear,
            req.body.sort,
            req.body.skip,
            req.body.limit,
            null
        );
        responseBody.result = data;
    } catch (error) {
        console.error(error);
        responseBody.desc = error.message || '';
        responseBody.status = false;
        responseBody.httpStatus = 500;
    }
    responseBody.serverloadms = (helpers.date.moment.timestampMS() - responseBody.serverloadms);
    return res.status(responseBody.httpStatus).json(responseBody);
};