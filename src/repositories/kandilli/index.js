const db = require('../../db');
const helpers = require('../../helpers');

module.exports.multiSave = async (data) => {
    try {
        if (data.length < 1) {
            return true;
        }
        let mustInsert = [];
        for (let index = 0; index < data.length; index++) {
            let find = await this.get(
                data[index].date,
                data[index].lokasyon,
                data[index].mag,
                data[index].depth,
                data[index].lng,
                data[index].lat
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
        let insert = await new db.MongoDB.CRUD('earthquake', 'data').insertMany(mustInsert);
        if (insert === false) {
            throw new Error('db insert error!');
        }
        return true;
    } catch (error) {
        console.error(error);
        return false;
    }
};

module.exports.get = async (date, lokasyon, mag, depth, lng, lat) => {
    try {
        let query = await new db.MongoDB.CRUD('earthquake', 'data').find(
            {
                date, lokasyon, mag, depth, lng, lat
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
    return await new db.MongoDB.CRUD('earthquake', 'data').update({ earhquake_id }, { $set: update });
};

module.exports.list = async (
    date = helpers.date.moment.moment().format('YYYY-MM-DD'),
    date_end = helpers.date.moment.moment().format('YYYY-MM-DD'),
    skip = 0,
    limit = 0,
    sort = null
) => {
    let match = { date_stamp: { $gte: date, $lte: date_end } };
    let agg = [];
    agg.push({ $match: match });
    if (sort) {
        agg.push({ $sort: sort });
    }
    if (skip > 0) {
        agg.push({ $skip: skip });
    }
    if (limit > 0) {
        agg.push({ $limit: limit });
    }
    const query = await new db.MongoDB.CRUD('earthquake', 'data').aggregate(
        [
            {
                $facet: {
                    data: agg,
                    metadata: [{ $match: match }, { $count: 'total' }]
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