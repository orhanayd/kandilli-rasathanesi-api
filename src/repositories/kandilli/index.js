const db = require('../../db');
const helpers = require('../../helpers');
const constants = require('../../constants');

module.exports.update = async (earhquake_id, update) => {
	return await new db.MongoDB.CRUD('earthquake', 'data_v2').update({ earhquake_id }, { $set: update });
};

module.exports.list = async (
	date_starts = new helpers.date.kk_date().add(-24, 'hours').format('YYYY-MM-DD HH:mm:ss'),
	date_ends = new helpers.date.kk_date().format('YYYY-MM-DD HH:mm:ss'),
	skip = 0,
	limit = 0,
	sort = null,
) => {
	const agg = [{ $match: { date_time: { $gte: date_starts, $lte: date_ends }, provider: constants.providers.KANDILLI } }];
	if (sort) {
		agg.push({ $sort: sort });
	}
	if (skip > 0) {
		agg.push({ $skip: Number(skip) });
	}
	if (limit > 0) {
		agg.push({ $limit: Number(limit) });
	}
	agg.push({ $project: { _id: false } });
	const query = await new db.MongoDB.CRUD('earthquake', 'data_v2').aggregate(agg);
	if (query.length > 0) {
		return { data: query, metadata: [{ count: query.length }] };
	}
	return { data: [], metadata: [{ count: 0 }] };
};
