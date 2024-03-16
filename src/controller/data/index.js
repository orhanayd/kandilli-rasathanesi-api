/* eslint-disable indent */
const helpers = require('../../helpers');
const constants = require('../../constants');

module.exports.statsGeneral = (req, res, next) => {
    let response = {
        status: true,
        httpStatus: 200,
        desc: ''
    };
    try {
        let body = {
            match: {
                date_time: {}
            }
        };
        body.match.provider = constants.providers.KANDILLI;
        body.provider = constants.providers.KANDILLI;

        if (typeof req.body.range !== 'string') {
            throw new Error('range missing!');
        }
        if ((req.body.range in constants.statsRange) === false) {
            throw new Error('range wrong!');
        }
        body.range = req.body.range;
        if (typeof req.body.provider === 'string') {
            if ((req.body.provider in constants.providers) === false) {
                throw new Error('provider wrong!');
            }
            body.match.provider = req.body.provider.toString();
            body.provider = body.match.provider;
        }

        if (typeof req.body.epiCenter === 'string') {
            body.match['location_properties.epiCenter.name'] = req.body.epiCenter.toString();
        }

        if (typeof req.body.types === 'undefined' || Array.isArray(req.body.types) === false) {
            req.body.types = [];
        }
        body.types = [];
        for (let index = 0; index < req.body.types.length; index++) {
            if ((req.body.types[index] in constants.stats) === false) {
                throw new Error('type value wrong !');
            }
            body.types.push(req.body.types[index].toString());
        }

        switch (req.body.range) {
            case constants.statsRange.TODAY:
                body.match.date_time = {
                    $gte: helpers.date.moment.moment().tz('Europe/Istanbul').startOf('day').format('YYYY-MM-DD HH:mm:ss'),
                    $lte: helpers.date.moment.moment().tz('Europe/Istanbul').endOf('day').format('YYYY-MM-DD HH:mm:ss'),
                };
                break;
            case constants.statsRange.YESTERDAY:
                body.match.date_time = {
                    $gte: helpers.date.moment.moment().tz('Europe/Istanbul').add(-1, 'days').startOf('day').format('YYYY-MM-DD HH:mm:ss'),
                    $lte: helpers.date.moment.moment().tz('Europe/Istanbul').add(-1, 'days').endOf('day').format('YYYY-MM-DD HH:mm:ss'),
                };
                break;
            case constants.statsRange.LAST3DAYS:
                body.match.date_time = {
                    $gte: helpers.date.moment.moment().tz('Europe/Istanbul').add(-3, 'days').startOf('day').format('YYYY-MM-DD HH:mm:ss'),
                    $lte: helpers.date.moment.moment().tz('Europe/Istanbul').endOf('day').format('YYYY-MM-DD HH:mm:ss'),
                };
                break;
            case constants.statsRange.LAST5DAYS:
                body.match.date_time = {
                    $gte: helpers.date.moment.moment().tz('Europe/Istanbul').add(-5, 'days').startOf('day').format('YYYY-MM-DD HH:mm:ss'),
                    $lte: helpers.date.moment.moment().tz('Europe/Istanbul').endOf('day').format('YYYY-MM-DD HH:mm:ss'),
                };
                break;
            case constants.statsRange.LAST7DAYS:
                body.match.date_time = {
                    $gte: helpers.date.moment.moment().tz('Europe/Istanbul').add(-7, 'days').startOf('day').format('YYYY-MM-DD HH:mm:ss'),
                    $lte: helpers.date.moment.moment().tz('Europe/Istanbul').endOf('day').format('YYYY-MM-DD HH:mm:ss'),
                };
                break;
            case constants.statsRange.THISMONTH:
                body.match.date_time = {
                    $gte: helpers.date.moment.moment().tz('Europe/Istanbul').startOf('month').format('YYYY-MM-DD HH:mm:ss'),
                    $lte: helpers.date.moment.moment().tz('Europe/Istanbul').endOf('month').format('YYYY-MM-DD HH:mm:ss'),
                };
                break;
            case constants.statsRange.LASTMONTH:
                body.match.date_time = {
                    $gte: helpers.date.moment.moment().tz('Europe/Istanbul').add(-1, 'month').startOf('month').format('YYYY-MM-DD HH:mm:ss'),
                    $lte: helpers.date.moment.moment().tz('Europe/Istanbul').add(-1, 'month').endOf('month').format('YYYY-MM-DD HH:mm:ss'),
                };
                break;
            case constants.statsRange.LAST2MONTHS:
                body.match.date_time = {
                    $gte: helpers.date.moment.moment().tz('Europe/Istanbul').add(-2, 'month').startOf('month').format('YYYY-MM-DD HH:mm:ss'),
                    $lte: helpers.date.moment.moment().tz('Europe/Istanbul').endOf('month').format('YYYY-MM-DD HH:mm:ss'),
                };
                break;
            case constants.statsRange.LAST3MONTHS:
                body.match.date_time = {
                    $gte: helpers.date.moment.moment().tz('Europe/Istanbul').add(-3, 'month').startOf('month').format('YYYY-MM-DD HH:mm:ss'),
                    $lte: helpers.date.moment.moment().tz('Europe/Istanbul').endOf('month').format('YYYY-MM-DD HH:mm:ss'),
                };
                break;
            default:
                throw new Error('no range type');
        }

        req.body = body;
        return next();
    } catch (error) {
        console.error(error);
        response.desc = error.message || '';
        response.httpStatus = 500;
        response.status = false;
        return res.status(response.httpStatus).json(response);
    }
};

module.exports.search = (req, res, next) => {
    let response = {
        status: true,
        httpStatus: 200,
        desc: ''
    };
    try {
        let body = {
            skip: 0,
            limit: 10,
            geoNear: null,
            match: {},
            sort: { date_time: -1 }
        };

        if (typeof req.body.skip === 'number') {
            body.skip = parseInt(req.body.skip, 10);
            if (isNaN(body.skip)) {
                throw new Error('isNaN skip!');
            }
        }

        if (typeof req.body.limit === 'number') {
            body.limit = parseInt(req.body.limit, 10);
            if (isNaN(body.limit)) {
                throw new Error('isNaN limit!');
            }
        }

        if (typeof req.body.geoNear === 'object') {
            if (typeof req.body.geoNear.lon !== 'number' && typeof req.body.geoNear.lat !== 'number') {
                throw new Error('lat or lon is not a number!');
            }
            if (typeof req.body.geoNear.radiusMeter !== 'number') {
                req.body.geoNear.radiusMeter = parseInt(req.body.geoNear.radiusMeter, 10);
                if (isNaN(req.body.geoNear.radiusMeter)) {
                    throw new Error('radiusMeter isNaN!');
                }
            }
            body.geoNear = {
                geojson: { $geoWithin: { $centerSphere: [[], 0] } }
            };
            body.geoNear.geojson['$geoWithin']['$centerSphere'][0][0] = parseFloat(req.body.geoNear.lon);
            body.geoNear.geojson['$geoWithin']['$centerSphere'][0][1] = parseFloat(req.body.geoNear.lat);
            body.geoNear.geojson['$geoWithin']['$centerSphere'][1] = helpers.metersToRadios(req.body.geoNear.radiusMeter);
        }

        if (typeof req.body.sort === 'string') {
            if (req.body.sort === 'date_1') {
                body.sort = { date_time: 1 };
            } else if (req.body.sort === 'date_-1') {
                body.sort = { date_time: -1 };
            } else if (req.body.sort === 'mag_1') {
                body.sort = { mag: 1 };
            } else if (req.body.sort === 'mag_-1') {
                body.sort = { mag: -1 };
            }
        }

        if (typeof req.body.match === 'object') {
            if (req.body.match.mag && typeof req.body.match.mag === 'number') {
                body.match.mag = { $gte: parseInt(req.body.match.mag, 10) };
                if (isNaN(body.match.mag['$gte'])) {
                    throw new Error('isNaN mag!');
                }
            }
            if (typeof req.body.match.date_starts === 'string' && typeof req.body.match.date_ends === 'string') {
                if (
                    !helpers.date.moment.isValid(req.body.match.date_starts, 'YYYY-MM-DD HH:mm:ss') ||
                    !helpers.date.moment.isValid(req.body.match.date_ends, 'YYYY-MM-DD HH:mm:ss')
                ) {
                    throw new Error('date_starts or date_ends is not valid!');
                }
                body.match.date_time = { $gte: req.body.search.date_starts.toStrings(), $lte: req.body.match.date_ends.toStrings() };
            }

            if (typeof req.body.match.cityCode === 'number') {
                body.match['location_properties.epiCenter.cityCode'] = parseInt(req.body.match.cityCode, 10);
                if (isNaN(body.match['location_properties.epiCenter.cityCode'])) {
                    throw new Error('cityCode isNaN!');
                }
            }
        }

        req.body = body;
        return next();
    } catch (error) {
        console.error(error);
        response.desc = error.message || '';
        response.httpStatus = 500;
        response.status = false;
        return res.status(response.httpStatus).json(response);
    }
};

module.exports.get = (req, res, next) => {
    let response = {
        status: true,
        httpStatus: 200,
        desc: ''
    };
    try {
        let query = {};

        if (typeof req.query.earthquake_id === 'undefined') {
            throw new Error('earthquake_id missing param!');
        }
        query.earthquake_id = req.query.earthquake_id.toString();
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