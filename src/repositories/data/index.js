const db = require('../../db');

module.exports.search = async (match = null, geoNear = null, sort = null, skip = null, limit = null, project = null) => {
    try {
        let agg = [];
        if (geoNear) {
            agg.push(
                {
                    $geoNear: geoNear
                }
            );
        } else {
            agg.push({ $match: match });
        }
        if (sort) {
            agg.push({ $sort: sort });
        }
        if (skip && skip > 0) {
            agg.push({ $skip: skip });
        }
        if (limit && limit > 0) {
            agg.push({ $limit: limit });
        }
        if (project) {
            agg.push({ $project: project });
        }
        const query = await new db.MongoDB.CRUD('earthquake', 'data').aggregate(
            agg
        );
        if (query === false) {
            throw new Error('kandilli archive search db error!');
        }
        if (query.length > 0) {
            return query;
        }
        return { data: [], metadata: [] };
    } catch (error) {
        console.error(error);
        return false;
    }
};