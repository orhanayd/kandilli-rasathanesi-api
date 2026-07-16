const db = require('../db');
const turf = require('@turf/turf');

// Geometri önbelleği: turf feature'ları, pointOnFeature ve bbox her çağrıda yeniden
// hesaplanmasın diye ilk kullanımda bir kez kurulur. Cache'lenen objeler asla mutate edilmez.
let GEO = null;

function buildGeoCache() {
	const entries = [];
	const byNumber = new Map();
	const locations_geojson_length = db.locations.geojsons.length;
	for (let index = 0; index < locations_geojson_length; index++) {
		const location = db.locations.geojsons[index];
		if (!location?.coordinates) continue;

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
		const entry = {
			name: location.name,
			number: location.number,
			population: db.populations[location.number] ? db.populations[location.number].population : null,
			feature: turf_polf,
			anchor: turf.pointOnFeature(turf_polf),
			bbox: turf.bbox(turf_polf),
			borderLine: null, // lazy: ilk fallback kullanımında turf.polygonToLine ile doldurulur
		};
		entries.push(entry);
		// db.locations.geojsons.find(...) davranışıyla birebir: dizi sırasına göre ilk eşleşen kazanır
		if (!byNumber.has(location.number)) {
			byNumber.set(location.number, entry);
		}
	}

	const airportPoints = [];
	const airports_length = db.locations.airports.length;
	for (let index = 0; index < airports_length; index++) {
		const airport = db.locations.airports[index];
		if (!airport?.coordinates?.coordinates) continue;
		airportPoints.push({
			name: airport.name,
			code: airport.code,
			coordinates: airport.coordinates,
			point: turf.point(airport.coordinates.coordinates, {
				name: airport.name,
				code: airport.code,
			}),
		});
	}

	return { entries, byNumber, airportPoints };
}

function geo() {
	if (!GEO) {
		GEO = buildGeoCache();
	}
	return GEO;
}

function locations(turfPoint) {
	const { entries, byNumber } = geo();
	let epiCenterProps = { name: null };
	let closestCities = [];
	const [lng, lat] = turfPoint.geometry.coordinates;
	const entries_length = entries.length;
	for (let index = 0; index < entries_length; index++) {
		const entry = entries[index];
		// bbox dışındaysa polygon içinde olması imkansız; pahalı testi atla
		const inBbox = lng >= entry.bbox[0] && lng <= entry.bbox[2] && lat >= entry.bbox[1] && lat <= entry.bbox[3];
		const isInside = inBbox ? turf.booleanPointInPolygon(turfPoint, entry.feature) : false;
		const distance = turf.distance(turfPoint, entry.anchor, {
			units: 'meters',
		});
		if (!isInside) {
			if (entry.number !== -1) {
				closestCities.push({
					name: entry.name,
					cityCode: entry.number,
					distance: Math.round(distance),
					population: entry.population,
				});
			}
		}
		if (isInside) {
			epiCenterProps = {
				name: entry.name,
				cityCode: entry.number,
				population: entry.population,
			};
		}
	}

	closestCities = closestCities.sort((a, b) => {
		return a.distance - b.distance;
	});

	// epiCenter bulunamadıysa, en yakın il polygon sınırına 1km'den yakınsa onu epiCenter kabul et
	if (epiCenterProps.name === null && closestCities.length > 0) {
		for (let i = 0; i < closestCities.length; i++) {
			const candidate = closestCities[i];
			if (candidate.cityCode === -1) continue;
			const entry = byNumber.get(candidate.cityCode);
			if (!entry) continue;
			try {
				// bbox'a uzaklık, sınıra uzaklığın alt sınırıdır; 1000m eşiğinin (2x güvenlik payıyla)
				// üzerindeyse pahalı nearestPointOnLine hesabı sonucu değiştiremez, atla
				const nearLng = Math.min(Math.max(lng, entry.bbox[0]), entry.bbox[2]);
				const nearLat = Math.min(Math.max(lat, entry.bbox[1]), entry.bbox[3]);
				const bboxDistance = turf.distance(turfPoint, turf.point([nearLng, nearLat]), { units: 'meters' });
				if (bboxDistance > 2000) continue;
				if (!entry.borderLine) {
					entry.borderLine = turf.polygonToLine(entry.feature);
				}
				const nearestPoint = turf.nearestPointOnLine(entry.borderLine, turfPoint);
				const borderDistance = turf.distance(turfPoint, nearestPoint, { units: 'meters' });
				if (borderDistance <= 1000) {
					epiCenterProps = {
						name: candidate.name,
						cityCode: candidate.cityCode,
						population: candidate.population,
					};
					break;
				}
			} catch (_e) {}
		}
	}

	return {
		closestCity: closestCities[0],
		epiCenter: epiCenterProps,
		closestCities: closestCities.slice(0, 5),
	};
}

function airports(turfPoint) {
	const { airportPoints } = geo();
	const result = [];
	const airports_length = airportPoints.length;
	for (let index = 0; index < airports_length; index++) {
		const airport = airportPoints[index];
		const distance = turf.distance(turfPoint, airport.point, {
			units: 'meters',
		});
		result.push({
			distance: Math.round(distance),
			name: airport.name,
			code: airport.code,
			coordinates: airport.coordinates,
		});
	}

	return result
		.sort((a, b) => {
			return a.distance - b.distance;
		})
		.slice(0, 3);
}

module.exports.location_properties = (lng, lat) => {
	const turfPoint = turf.point([lng, lat]);
	return { ...locations(turfPoint), airports: airports(turfPoint) };
};

module.exports.warm = () => {
	geo();
	return true;
};
