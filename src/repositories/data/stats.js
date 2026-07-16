const db = require('../../db');

module.exports.dateBy = async (match) => {
	return await new db.MongoDB.CRUD('earthquake', 'data_v2').aggregate([
		{
			$match: match,
		},
		{
			$addFields: {
				date_time: {
					$dateFromString: {
						dateString: '$date_time',
						format: '%Y-%m-%d %H:%M:%S',
					},
				},
			},
		},
		{
			$group: {
				_id: {
					$dateToString: {
						format: '%Y-%m-%d',
						date: '$date_time',
					},
				},
				total: {
					$sum: 1,
				},
			},
		},
		{
			$sort: { total: -1 },
		},
	]);
};

module.exports.hourBy = async (match) => {
	return await new db.MongoDB.CRUD('earthquake', 'data_v2').aggregate([
		{
			$match: match,
		},
		{
			$addFields: {
				date_time: {
					$dateFromString: {
						dateString: '$date_time',
						format: '%Y-%m-%d %H:%M:%S',
					},
				},
			},
		},
		{
			$group: {
				_id: {
					$dateToString: {
						format: '%H',
						date: '$date_time',
					},
				},
				total: {
					$sum: 1,
				},
			},
		},
		{
			$sort: { total: -1 },
		},
	]);
};

module.exports.epiCenterBy = async (match) => {
	return await new db.MongoDB.CRUD('earthquake', 'data_v2').aggregate([
		{
			$match: match,
		},
		{
			$group: {
				_id: '$location_properties.epiCenter.name',
				total: {
					$sum: 1,
				},
			},
		},
		{
			$sort: {
				total: -1,
			},
		},
		{
			$limit: 5,
		},
	]);
};

module.exports.magBy = async (match) => {
	return await new db.MongoDB.CRUD('earthquake', 'data_v2').aggregate([
		{
			$match: match,
		},
		{
			$group: {
				_id: { $toInt: '$mag' },
				total: {
					$sum: 1,
				},
				epiCenter: {
					$addToSet: '$location_properties.epiCenter.name',
				},
			},
		},
		{
			$sort: {
				total: -1,
			},
		},
	]);
};

module.exports.airportsBy = async (match) => {
	return await new db.MongoDB.CRUD('earthquake', 'data_v2').aggregate([
		{
			$match: match,
		},
		{
			$group: {
				_id: { $first: '$location_properties.airports.name' },
				total: {
					$sum: 1,
				},
			},
		},
		{
			$sort: {
				total: -1,
			},
		},
		{
			$limit: 5,
		},
	]);
};

// Statik veri; her istekte yeniden hesaplanmasın diye modül yüklenirken bir kez kurulur.
// cities.js kullanılır ki public process 21MB geojson verisini yüklemek zorunda kalmasın.
const cities = require('../../db/cities');
const EPI_CENTERS = Object.freeze(
	(() => {
		const result = [];
		const cities_length = cities.length;
		for (let index = 0; index < cities_length; index++) {
			result.push({
				city: cities[index].name,
				cityCode: cities[index].number,
				population: db.populations[cities[index].number]?.population,
			});
		}
		result.sort((a, b) => {
			const nameA = a.city.toUpperCase(); // ignore upper and lowercase
			const nameB = b.city.toUpperCase(); // ignore upper and lowercase
			if (nameA < nameB) {
				return -1;
			}
			if (nameA > nameB) {
				return 1;
			}
			// names must be equal
			return 0;
		});
		return result.map(Object.freeze);
	})(),
);

module.exports.epiCenters = () => EPI_CENTERS;

module.exports.dateByEarthQuakes = async (match) => {
	return await new db.MongoDB.CRUD('earthquake', 'data_v2').aggregate([
		{
			$match: match,
		},
		{
			$addFields: {
				date_time: {
					$dateFromString: {
						dateString: '$date_time',
						format: '%Y-%m-%d %H:%M:%S',
					},
				},
			},
		},
		{
			$group: {
				_id: {
					$dateToString: {
						format: '%Y-%m-%d',
						date: '$date_time',
					},
				},
				total: {
					$sum: 1,
				},
				data: {
					$push: {
						earthquake_id: '$earthquake_id',
						mag: '$mag',
						geojson: '$geojson',
						title: '$title',
						date_time: '$date_time',
						location_properties_epiCenter_name: '$location_properties.epiCenter.name',
					},
				},
			},
		},
		{
			$sort: { _id: 1 },
		},
	]);
};
