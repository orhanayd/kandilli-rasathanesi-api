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

module.exports.archive = async (date = helpers.date.moment.moment().format('YYYY-MM-DD'), limit = null) => {
    let query = await new db.MongoDB.CRUD('earthquake', 'data').find({ date_stamp: date }, [0, limit], {}, { _id: -1 });
    if (query === false) {
        throw new Error('kandilli archive find db error!');
    }
    return query;
};
