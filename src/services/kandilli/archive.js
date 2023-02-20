/* eslint-disable no-inner-declarations */
const helpers = require('../../helpers');
const repositories = require('../../repositories');

module.exports = async (req, res) => {
    let responseBody = {
        status: true,
        httpStatus: 200,
        serverloadms: helpers.date.moment.timestampMS(),
        desc: '',
        metadata: {},
        result: []
    };
    try {
        const kandilli_data = await repositories.kandilli.archive(req.query.date, req.query.date_end, req.query.limit);
        if (!kandilli_data) {
            responseBody.status = false;
            responseBody.desc = 'Veri alınamadı!';
        }
        responseBody.result = kandilli_data.data;
        responseBody.metadata = kandilli_data.metadata[0];
    } catch (error) {
        console.error(error);
        responseBody.desc = error.message || '';
        responseBody.status = false;
        responseBody.httpStatus = 500;
    }
    responseBody.serverloadms = (helpers.date.moment.timestampMS() - responseBody.serverloadms);
    return res.status(responseBody.httpStatus).json(responseBody);
};