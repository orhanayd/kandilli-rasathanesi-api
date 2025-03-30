const db = require('../../db');

module.exports.stats = require('./stats');

module.exports.search = async (match = null, geoNear = null, sort = null, skip = null, limit = null, project = null) => {
	try {
		const agg = [];
		agg.push({ $match: geoNear ? { ...match, ...geoNear } : match });

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
		const query = await new db.MongoDB.CRUD('earthquake', 'data_v2').aggregate(agg);
		if (query === false) {
			throw new Error('kandilli archive search db error!');
		}
		if (query.length > 0) {
			return query;
		}
		return [];
	} catch (error) {
		console.error(error);
		return false;
	}
};

module.exports.get = async (earthquake_id, project = {}) => {
	try {
		const query = await new db.MongoDB.CRUD('earthquake', 'data_v2').find({ earthquake_id }, [0, 1], project);
		if (query === false) {
			throw new Error('kandilli archive search db error!');
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
