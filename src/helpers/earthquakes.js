const db = require('../db');
const turf = require('@turf/turf');

module.exports.location_properties = (lng, lat) => {
    let turfPoint = turf.point([lng, lat]);

    function locations(turfPoint) {
        let closestPoly = { properties: { name: null } };
        let minDistance = null;
        let epiCenter = { properties: { name: null } };
        for (let index = 0; index < db.locations.length; index++) {
            const turf_polf = turf.polygon(db.locations[index].coordinates, { name: db.locations[index].name });
            const pointOnPoly = turf.pointOnFeature(turf_polf.geometry.coordinates);
            const isInside = turf.booleanPointInPolygon(turfPoint, turf_polf.geometry.coordinates);
            const distance = turf.distance(turfPoint, pointOnPoly, { units: 'meters' });
            if (!minDistance || (distance < minDistance && !isInside)) {
                closestPoly = turf_polf;
                closestPoly.properties.distance = distance;
                minDistance = distance;
            }
            if (isInside) {
                epiCenter = turf_polf;
            }
        }
        return { closestCity: closestPoly.properties, epiCenter: epiCenter.properties };
    }

    function airports(turfPoint) {
        let airports = [];
        for (let index = 0; index < db.airports.length; index++) {
            const turf_polf = turf.polygon(db.airports[index].coordinates, { name: db.airports[index].name, code: db.airports[index].code });
            const pointOnPoly = turf.pointOnFeature(turf_polf.geometry.coordinates);
            const distance = turf.distance(turfPoint, pointOnPoly, { units: 'meters' });
            airports.push(
                {
                    distance,
                    name: db.airports[index].name,
                    code: db.airports[index].code,
                    coordinates: db.airports[index].coordinates
                }
            );
        }

        return airports.sort((a, b) => {
            return a.distance - b.distance;
        }).slice(0, 3);
    }
    return { ...locations(turfPoint), airports: airports(turfPoint) };
};
