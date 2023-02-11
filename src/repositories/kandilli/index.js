const db = require('../../db');

module.exports.multiSave = async (data) => {
    try {
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