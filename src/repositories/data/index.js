const db = require('../../db');
const helpers_crawler = require('../../helpers/crawler/helpers');

module.exports.stats = require('./stats');

module.exports.createIndexes = async () => {
	try {
		const crud = new db.MongoDB.CRUD('earthquake', 'data_v2');
		await crud.createIndex(
			{ provider: 1, date_time: 1, mag: 1, depth: 1, 'geojson.coordinates.0': 1, 'geojson.coordinates.1': 1 },
			{ name: 'dedup_key' },
		);
		await crud.createIndex({ date_time: -1 });
		await crud.createIndex({ earthquake_id: 1 });
	} catch (err) {
		console.error('data.createIndexes error:', err);
	}
};

const dedupKey = (item) =>
	`${item.provider}|${item.date_time}|${item.mag}|${item.depth}|${item.geojson.coordinates[0]}|${item.geojson.coordinates[1]}`;

module.exports.multiSave = async (data, collection = 'data_v2') => {
	const candidates = data.filter((item) => !Number.isNaN(item.mag));
	if (candidates.length < 1) {
		return true;
	}
	let minDate = candidates[0].date_time;
	let maxDate = candidates[0].date_time;
	const providers = new Set();
	for (const item of candidates) {
		if (item.date_time < minDate) minDate = item.date_time;
		if (item.date_time > maxDate) maxDate = item.date_time;
		providers.add(item.provider);
	}
	const existing = await new db.MongoDB.CRUD('earthquake', 'data_v2').find(
		{ date_time: { $gte: minDate, $lte: maxDate }, provider: { $in: [...providers] } },
		[0, 0],
		{ _id: false, provider: true, date_time: true, mag: true, depth: true, 'geojson.coordinates': true },
	);
	const seen = new Set(existing.map(dedupKey));
	const mustInsert = [];
	for (const item of candidates) {
		const key = dedupKey(item);
		if (!seen.has(key)) {
			seen.add(key);
			mustInsert.push(item);
		}
	}
	if (mustInsert.length < 1) {
		return true;
	}
	helpers_crawler.enrich(mustInsert);
	await new db.MongoDB.CRUD('earthquake', collection).insertMany(mustInsert);
	return true;
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
	agg.push({ $project: { ...project, _id: false } });
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
	return await new db.MongoDB.CRUD('earthquake', 'data_v2').estimatedCount();
};

module.exports.get = async (earthquake_id, project = { _id: false }) => {
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
