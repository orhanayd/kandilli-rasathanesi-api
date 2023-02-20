/* eslint-disable no-inner-declarations */
const helpers = require('../../helpers');
const repositories = require('../../repositories');

module.exports = async (req, res) => {
    let responseBody = {
        status: true,
        httpStatus: 200,
        serverloadms: helpers.date.moment.timestampMS(),
        desc: ''
    };
    try {
        async function start() {
            const kandilli_data = await helpers.crawler.kandilli.get();
            repositories.kandilli.multiSave(kandilli_data.data);
        }
        start();
    } catch (error) {
        console.error(error);
        responseBody.desc = error.message || '';
        responseBody.status = false;
        responseBody.httpStatus = 500;
    }
    responseBody.serverloadms = (helpers.date.moment.timestampMS() - responseBody.serverloadms);
    return res.status(responseBody.httpStatus).json(responseBody);
};