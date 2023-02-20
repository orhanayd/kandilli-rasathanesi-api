const helpers = require('../../helpers');

module.exports.live = (req, res, next) => {
    let response = {
        status: true,
        httpStatus: 200,
        desc: ''
    };
    try {
        let query = {
            limit: null
        };

        if (req.query.limit && typeof req.query.limit === 'string') {
            query.limit = parseInt(req.query.limit, 10);
            if (isNaN(query.limit)) {
                throw new Error('isNaN limit!');
            }
        }

        req.query = query;
        return next();
    } catch (error) {
        console.error(error);
        response.desc = error.message || '';
        response.httpStatus = 500;
        response.status = false;
        return res.status(response.httpStatus).json(response);
    }
};

module.exports.archive = (req, res, next) => {
    let response = {
        status: true,
        httpStatus: 200,
        desc: ''
    };
    try {
        let query = {
            limit: 100,
            date: helpers.date.moment.moment().format('YYYY-MM-DD'),
            date_end: helpers.date.moment.moment().format('YYYY-MM-DD'),
        };

        if (req.query.limit && typeof req.query.limit === 'string') {
            query.limit = parseInt(req.query.limit, 10);
            if (isNaN(query.limit)) {
                throw new Error('isNaN limit!');
            }
            if (query.limit > 1000) {
                query.limit = 1000;
            }
        }

        if (req.query.date && typeof req.query.date === 'string') {
            req.query.date = req.query.date.toString();
            if (!helpers.date.moment.isValid(req.query.date, 'YYYY-MM-DD')) {
                throw new Error('date wrong param!');
            }
            query.date = req.query.date;
        }
        if (req.query.date_end && typeof req.query.date_end === 'string') {
            req.query.date_end = req.query.date_end.toString();
            if (!helpers.date.moment.isValid(req.query.date_end, 'YYYY-MM-DD')) {
                throw new Error('date_end wrong param!');
            }
            query.date_end = req.query.date_end;
        }

        req.query = query;
        return next();
    } catch (error) {
        console.error(error);
        response.desc = error.message || '';
        response.httpStatus = 500;
        response.status = false;
        return res.status(response.httpStatus).json(response);
    }
};