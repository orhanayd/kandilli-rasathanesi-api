const db = require('../../db');

module.exports.stats = require('./stats');

module.exports.multiSave = async (data, collection = 'data_v2') => {
	if (data.length < 1) {
		return true;
	}
	const mustInsert = [];
	const data_length = data.length;
	for (let index = 0; index < data_length; index++) {
		if (Number.isNaN(data[index].mag)) {
			continue;
		}
		const find = await this.checkIsInserted(
			data[index].provider,
			data[index].date_time,
			data[index].mag,
			data[index].depth,
			data[index].geojson.coordinates[0],
			data[index].geojson.coordinates[1],
		);
		if (find === false) {
			mustInsert.push(data[index]);
		}
	}
	if (mustInsert.length < 1) {
		return true;
	}
	await new db.MongoDB.CRUD('earthquake', collection).insertMany(mustInsert);
	return true;
};

module.exports.checkIsInserted = async (provider, date_time, mag, depth, lng, lat) => {
	const query = await new db.MongoDB.CRUD('earthquake', 'data_v2').find(
		{
			provider,
			date_time,
			mag,
			depth,
			'geojson.coordinates.0': lng,
			'geojson.coordinates.1': lat,
		},
		[0, 1],
		{ _id: false, date_time: true },
	);
	if (query.length > 0) {
		return true;
	}
	return false;
};

module.exports.search = async (match = null, geoNear = null, sort = null, skip = null, limit = null, project = null) => {
	const agg = [];
	agg.push({ $match: geoNear ? { ...match, ...geoNear } : match });

	if (sort) {
		agg.push({ $sort: sort });
	}
	if (skip && skip > 0) {
		agg.push({ $skip: Number(skip) });
	}
	if (limit && limit > 0) {
		agg.push({ $limit: Number(limit) });
	}
	if (project) {
		agg.push({ $project: project });
	}
	const query = await new db.MongoDB.CRUD('earthquake', 'data_v2').aggregate(agg);
	if (query.length > 0) {
		return query;
	}
	return [];
};

module.exports.sitemap = async (skip, limit) => {
	const agg = [
		{ $sort: { date_time: -1 } },
		{ $skip: Number(skip) },
		{ $limit: Number(limit) },
		{ $project: { _id: false, earthquake_id: 1, title: 1, date_time: 1, mag: 1, 'location_properties.epiCenter': 1 } },
	];
	const query = await new db.MongoDB.CRUD('earthquake', 'data_v2').aggregate(agg);
	return query.length > 0 ? query : [];
};

module.exports.sitemapCount = async () => {
	return await new db.MongoDB.CRUD('earthquake', 'data_v2').count({});
};

module.exports.get = async (earthquake_id, project = {}) => {
	try {
		const query = await new db.MongoDB.CRUD('earthquake', 'data_v2').find({ earthquake_id }, [0, 1], project);
		if (query.length > 0) {
			return query[0];
		}
		return null;
	} catch (error) {
		console.error(error);
		return false;
	}
};
