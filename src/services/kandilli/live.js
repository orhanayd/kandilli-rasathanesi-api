/* eslint-disable no-inner-declarations */
const helpers = require('../../helpers');
const repositories = require('../../repositories');
const db = require('../../db');

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
        const live_date = helpers.date.moment.moment().format('YYYY-MM-DD');
        let kandilli_data;
        const key = `kandilli/live/${req.query.skip}/${req.query.limit}`;
        const check_noperedis = db.nopeRedis.getItem(key);
        if (check_noperedis) {
            kandilli_data = check_noperedis;
        } else {
            kandilli_data = await repositories.kandilli.list(live_date, live_date, req.query.skip, req.query.limit, { _id: -1 });
            db.nopeRedis.setItem(key, kandilli_data, 30);
        }
        if (!kandilli_data) {
            responseBody.status = false;
            responseBody.desc = 'Veri alınamadı!';
        }
        responseBody.result = kandilli_data.data;
        responseBody.metadata = { date: live_date, ...kandilli_data.metadata[0] };
    } catch (error) {
        console.error(error);
        responseBody.desc = error.message || '';
        responseBody.status = false;
        responseBody.httpStatus = 500;
    }
    responseBody.serverloadms = (helpers.date.moment.timestampMS() - responseBody.serverloadms);
    return res.status(responseBody.httpStatus).json(responseBody);
};