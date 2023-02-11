const constants = require('../constants');

/**
 * This middleware for auth mechanism.
 */
module.exports = async (req, res, next) => {
    let response = {
        status: true,
        httpStatus: 200,
        desc: '',
    };
    try {
        if (!req.headers.authorization) {
            throw new Error('missing systemid or authorization');
        }

        if (req.headers.authorization !== constants.CONFIG.CRON_KEY) {
            throw new Error('missing systemid or authorization');
        }

        return next();
    } catch (error) {
        console.error(error);
        response.desc = error.message || '';
        response.status = false;
        response.httpStatus = 500;
        return res.status(response.httpStatus).json(response);
    }
};