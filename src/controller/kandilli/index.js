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
            date: helpers.date.moment.moment().format('YYYY-MM-DD')
        };

        if (req.query.limit && typeof req.query.limit === 'string') {
            query.limit = parseInt(req.query.limit, 10);
            if (isNaN(query.limit)) {
                throw new Error('isNaN limit!');
            }
        }

        if (req.query.date && typeof req.query.date === 'string') {
            req.query.date = req.query.date.toString();
            if (!helpers.date.moment.isValid(req.query.date, 'YYYY-MM-DD')) {
                throw new Error('date wrong param!');
            }
            query.date = req.query.date;
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