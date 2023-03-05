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
            sort: { date_stamp: -1 }
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
            body.geoNear = {
                near: {
                    type: 'Point',
                    coordinates: []
                },
                distanceField: 'distance'
            };
            body.geoNear.near.coordinates[0] = parseFloat(req.body.geoNear.lon);
            body.geoNear.near.coordinates[1] = parseFloat(req.body.geoNear.lat);
            if (typeof req.body.geoNear.maxDistance === 'number') {
                body.geoNear.maxDistance = parseInt(req.body.geoNear.maxDistance, 10);
                if (isNaN(req.body.geoNear.maxDistance)) {
                    throw new Error('isNaN geoNear maxDistance!');
                }
            }
        }

        if (typeof req.body.sort === 'string') {
            if (req.body.sort === 'date_1') {
                body.sort = { date: 1 };
            } else if (req.body.sort === 'date_-1') {
                body.sort = { date: -1 };
            } else if (req.body.sort === 'mag_1') {
                body.sort = { mag: 1 };
            } else if (req.body.sort === 'mag_-1') {
                body.sort = { mag: -1 };
            }
        }

        if (typeof req.body.search === 'object') {
            if (req.body.search.mag && typeof req.body.search.mag === 'number') {
                body.match.mag = { $gte: parseInt(req.body.search.mag, 10) };
                if (isNaN(body.match.search.mag['$gte'])) {
                    throw new Error('isNaN mag!');
                }
            }
            if (typeof req.body.search.date_starts === 'string' && typeof req.body.search.date_ends === 'string') {
                if (
                    !helpers.date.moment.isValid(req.body.search.date_starts, 'YYYY-MM-DD') ||
                    helpers.date.moment.isValid(req.body.search.date_ends, 'YYYY-MM-DD')
                ) {
                    throw new Error('date_starts or date_ends is not valid!');
                }
                body.match.date_stamp = { $gte: req.body.search.date_starts.toStrings(), $lte: req.body.search.date_ends.toStrings() };
            }

            if (typeof req.body.search.cityCode === 'number') {
                body.match.cityCode = parseInt(req.body.search.cityCode, 10);
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