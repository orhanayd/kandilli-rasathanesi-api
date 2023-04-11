const db = require('../../db');
const helpers = require('../../helpers');

module.exports.multiSave = async (data, collection = 'data_v2') => {
    try {
        if (data.length < 1) {
            return true;
        }
        let mustInsert = [];
        for (let index = 0; index < data.length; index++) {
            if (isNaN(data[index].mag)) {
                continue;
            }
            const find = await this.checkIsInserted(
                data[index].date_time,
                data[index].mag,
                data[index].depth,
                data[index].geojson.coordinates[0],
                data[index].geojson.coordinates[1]
            );
            if (find === false) {
                continue;
            }
            if (find === null) {
                mustInsert.push(data[index]);
            }
        }
        if (mustInsert.length < 1) {
            return true;
        }
        const insert = await new db.MongoDB.CRUD('earthquake', collection).insertMany(mustInsert);
        if (insert === false) {
            throw new Error('db insert error!');
        }
        return true;
    } catch (error) {
        console.error(error);
        return false;
    }
};

module.exports.checkIsInserted = async (date_time, mag, depth, lng, lat) => {
    try {
        const query = await new db.MongoDB.CRUD('earthquake', 'data_v2').find(
            {
                date_time, mag, depth, 'geojson.coordinates.0': lng, 'geojson.coordinates.1': lat
            }
        );
        if (query === false) {
            throw new Error('db find error!');
        }
        if (query.length > 0) {
            return query[0];
        }
        return null;
    } catch (error) {
        console.error(error);
        return false;
    }
};

module.exports.update = async (earhquake_id, update) => {
    return await new db.MongoDB.CRUD('earthquake', 'data_v2').update({ earhquake_id }, { $set: update });
};

module.exports.list = async (
    date_starts = helpers.date.moment.moment().tz('Europe/Istanbul').add(-24, 'hours').format('YYYY-MM-DD HH:mm:ss'),
    date_ends = helpers.date.moment.moment().tz('Europe/Istanbul').format('YYYY-MM-DD HH:mm:ss'),
    skip = 0,
    limit = 0,
    sort = null
) => {
    let match = { date_time: { $gte: date_starts, $lte: date_ends } };
    let agg = [];
    let agg2 = [];
    agg2.push({ $match: match });
    if (sort) {
        agg2.push({ $sort: sort });
    }
    if (skip > 0) {
        agg.push({ $skip: skip });
    }
    if (limit > 0) {
        agg.push({ $limit: limit });
    }
    const query = await new db.MongoDB.CRUD('earthquake', 'data_v2').aggregate(
        [
            ...agg2,
            {
                $facet: {
                    data: agg,
                    metadata: [{ $count: 'total' }]
                }
            }
        ]
    );
    if (query === false) {
        throw new Error('kandilli archive find db error!');
    }
    if (query.length > 0) {
        return query[0];
    }
    return { data: [], metadata: [] };
};