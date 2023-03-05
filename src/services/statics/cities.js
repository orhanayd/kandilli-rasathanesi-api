const db = require('../../db');
const helpers = require('../../helpers');

module.exports = async (req, res) => {
    let responseBody = {
        status: true,
        httpStatus: 200,
        serverloadms: helpers.date.moment.timestampMS(),
        desc: '',
        result: {}
    };
    try {
        responseBody.result = db.populations;
    } catch (error) {
        console.error(error);
        responseBody.desc = error.message || '';
        responseBody.status = false;
        responseBody.httpStatus = 500;
    }
    responseBody.serverloadms = (helpers.date.moment.timestampMS() - responseBody.serverloadms);
    return res.status(responseBody.httpStatus).json(responseBody);
};