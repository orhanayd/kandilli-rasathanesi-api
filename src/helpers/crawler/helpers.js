const helpers = require('../../helpers');
const db = require('../../db');
const constants = require('../../constants');
const earthquakes = require('../earthquakes');

module.exports.kandilli_models = (data, limit = null) => {
	try {
		const model_data = [];
		const data_length = data.length;
		for (let index = 0; index < data_length; index++) {
			if (limit && index + 1 > limit) {
				break;
			}
			let rev = null;
			data[index]['@_lokasyon'] = data[index]['@_lokasyon'].trim();
			const splitted = data[index]['@_lokasyon'].split(')');
			if (splitted && splitted.length > 2) {
				data[index]['@_lokasyon'] = `${splitted[0]})`;
				rev = `${splitted[1]})`.trim();
			}
			data[index]['@_lng'] = parseFloat(data[index]['@_lng']);
			data[index]['@_lat'] = parseFloat(data[index]['@_lat']);
			model_data.push({
				earthquake_id: db.MongoDB.id(),
				provider: constants.providers.KANDILLI,
				title: data[index]['@_lokasyon'],
				mag: parseFloat(data[index]['@_mag']),
				depth: parseFloat(data[index]['@_Depth']),
				geojson: {
					type: 'Point',
					coordinates: [data[index]['@_lng'], data[index]['@_lat']],
				},
				rev,
				date_time: new helpers.date.kk_date(data[index]['@_name']).format('YYYY-MM-DD HH:mm:ss'),
				created_at: parseInt(new helpers.date.kk_date(data[index]['@_name']).format('X'), 10),
				location_tz: 'Europe/Istanbul',
			});
		}
		return { data: model_data, metadata: { total: data.length } };
	} catch (error) {
		console.error(error);
		return { data: [], metadata: { total: 0 } };
	}
};

module.exports.enrich = (records) => {
	for (const record of records) {
		record.location_properties = earthquakes.location_properties(record.geojson.coordinates[0], record.geojson.coordinates[1]);
	}
	return records;
};

module.exports.afad_models = (data, limit = null) => {
	try {
		const model_data = [];
		const data_length = data.length;
		for (let index = 0; index < data_length; index++) {
			if (limit && index + 1 > limit) {
				break;
			}
			data[index]['location'] = data[index]['location'].trim();
			data[index]['longitude'] = parseFloat(data[index]['longitude']);
			data[index]['latitude'] = parseFloat(data[index]['latitude']);
			model_data.push({
				earthquake_id: db.MongoDB.id(),
				provider: constants.providers.AFAD,
				title: data[index]['location'],
				mag: parseFloat(data[index]['magnitude']),
				depth: parseFloat(data[index]['depth']),
				geojson: {
					type: 'Point',
					coordinates: [data[index]['longitude'], data[index]['latitude']],
				},
				rev: null,
				date_time: new helpers.date.kk_date(data[index]['eventDate']).add(3, 'hours').format('YYYY-MM-DD HH:mm:ss'),
				created_at: parseInt(new helpers.date.kk_date(data[index]['eventDate']).add(3, 'hours').format('X'), 10),
				location_tz: 'Europe/Istanbul',
			});
		}
		return { data: model_data, metadata: { total: data.length } };
	} catch (error) {
		console.error(error);
		return { data: [], metadata: { total: 0 } };
	}
};
