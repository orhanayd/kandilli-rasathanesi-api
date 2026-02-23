const db = require('../db');
const turf = require('@turf/turf');

function locations(turfPoint) {
	let closestPoly = { properties: { name: null } };
	let epiCenter = { properties: { name: null } };
	let closestCities = [];
	const locations_geojson_length = db.locations.geojsons.length;
	for (let index = 0; index < locations_geojson_length; index++) {
		const location = db.locations.geojsons[index];
		if (!location || !location.coordinates) continue;

		// MultiPolygon için tüm polygon parçalarını kullan
		let turf_polf;
		if (location.coordinates.type === 'MultiPolygon') {
			if (!location.coordinates.coordinates || !Array.isArray(location.coordinates.coordinates)) continue;
			turf_polf = turf.multiPolygon(location.coordinates.coordinates, {
				name: location.name,
				cityCode: location.number,
			});
		} else {
			const coords = location.coordinates.coordinates || location.coordinates;
			if (!coords || !Array.isArray(coords)) continue;
			turf_polf = turf.polygon(coords, {
				name: location.name,
				cityCode: location.number,
			});
		}
		const pointOnPoly = turf.pointOnFeature(turf_polf);
		const isInside = turf.booleanPointInPolygon(turfPoint, turf_polf);
		const distance = turf.distance(turfPoint, pointOnPoly, {
			units: 'meters',
		});
		if (!isInside) {
			closestPoly = turf_polf;
			closestPoly.properties.distance = Math.round(distance);
			closestPoly.properties.population = db.populations[db.locations.geojsons[index].number]
				? db.populations[db.locations.geojsons[index].number].population
				: null;
			if (closestPoly.properties.cityCode !== -1) {
				closestCities.push(closestPoly.properties);
			}
		}
		if (isInside) {
			epiCenter = turf_polf;
			epiCenter.properties.population = db.populations[db.locations.geojsons[index].number]
				? db.populations[db.locations.geojsons[index].number].population
				: null;
		}
	}

	closestCities = closestCities.sort((a, b) => {
		return a.distance - b.distance;
	});

	// epiCenter bulunamadıysa, en yakın il polygon sınırına 1km'den yakınsa onu epiCenter kabul et
	if (epiCenter.properties.name === null && closestCities.length > 0) {
		for (let i = 0; i < closestCities.length; i++) {
			const candidate = closestCities[i];
			if (candidate.cityCode === -1) continue;
			const loc = db.locations.geojsons.find((g) => g.number === candidate.cityCode);
			if (!loc) continue;
			try {
				let poly;
				if (loc.coordinates.type === 'MultiPolygon') {
					poly = turf.multiPolygon(loc.coordinates.coordinates);
				} else {
					const coords = loc.coordinates.coordinates || loc.coordinates;
					poly = turf.polygon(coords);
				}
				const borderLine = turf.polygonToLine(poly);
				const nearestPoint = turf.nearestPointOnLine(borderLine, turfPoint);
				const borderDistance = turf.distance(turfPoint, nearestPoint, { units: 'meters' });
				if (borderDistance <= 1000) {
					epiCenter = {
						properties: {
							name: candidate.name,
							cityCode: candidate.cityCode,
							population: candidate.population,
						},
					};
					break;
				}
			} catch (_e) {}
		}
	}

	return {
		closestCity: closestCities[0],
		epiCenter: epiCenter.properties,
		closestCities: closestCities.slice(0, 5),
	};
}

function airports(turfPoint) {
	const airports = [];
	const airports_length = db.locations.airports.length;
	for (let index = 0; index < airports_length; index++) {
		const airport = db.locations.airports[index];
		if (!airport || !airport.coordinates || !airport.coordinates.coordinates) continue;

		const airportPoint = turf.point(airport.coordinates.coordinates, {
			name: airport.name,
			code: airport.code,
		});
		const distance = turf.distance(turfPoint, airportPoint, {
			units: 'meters',
		});
		airports.push({
			distance: Math.round(distance),
			name: airport.name,
			code: airport.code,
			coordinates: airport.coordinates,
		});
	}

	return airports
		.sort((a, b) => {
			return a.distance - b.distance;
		})
		.slice(0, 3);
}

module.exports.location_properties = (lng, lat) => {
	const turfPoint = turf.point([lng, lat]);
	return { ...locations(turfPoint), airports: airports(turfPoint) };
};
