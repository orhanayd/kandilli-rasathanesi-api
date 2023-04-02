const helpers = require('../../helpers');

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
                    helpers.date.moment.isValid(req.body.match.date_ends, 'YYYY-MM-DD HH:mm:ss')
                ) {
                    throw new Error('date_starts or date_ends is not valid!');
                }
                body.match.date_time = { $gte: req.body.search.date_starts.toStrings(), $lte: req.body.match.date_ends.toStrings() };
            }

            if (typeof req.body.match.cityCode === 'number') {
                body.match['location_properties.epiCenter.cityCode'] = parseInt(req.body.match.cityCode, 10);
                if (isNaN(body.match.cityCode)) {
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