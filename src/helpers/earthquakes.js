const db = require('../db');
const turf = require('@turf/turf');

module.exports.location_properties = (lng, lat) => {
    let turfPoint = turf.point([lng, lat]);

    function locations(turfPoint) {
        let features = [];
        for (let index = 0; index < db.locations.length; index++) {
            features.push(turf.polygon(db.locations[index].coordinates, { name: db.locations[index].name }));
        }
        const polyFC = turf.featureCollection(features);
        let closestPoly = null;
        let minDistance = null;
        let epiCenter = null;
        for (let index = 0; index < polyFC.features.length; index++) {
            let pointOnPoly = turf.pointOnFeature(polyFC.features[index].geometry.coordinates);
            let isInside = turf.booleanPointInPolygon(turfPoint, polyFC.features[index].geometry.coordinates);
            let distance = turf.distance(turfPoint, pointOnPoly, { units: 'meters' });
            if (!minDistance || (distance < minDistance && !isInside)) {
                closestPoly = polyFC.features[index];
                closestPoly.properties.distance = distance;
                minDistance = distance;
            }
            if (isInside) {
                epiCenter = polyFC.features[index];
            }
        }
        if (!closestPoly) {
            closestPoly = { properties: { name: '?' } };
        }
        if (!epiCenter) {
            epiCenter = { properties: { name: '?' } };
        }
        return { closestCity: closestPoly.properties, epiCenter: epiCenter.properties };
    }

    function airports(turfPoint) {
        let features = [];
        for (let index = 0; index < db.airports.length; index++) {
            features.push(turf.polygon(
                db.airports[index].coordinates, { name: db.airports[index].name, code: db.airports[index].code }
            ));
        }
        const polyFC = turf.featureCollection(features);
        let airports = [];
        for (let index = 0; index < polyFC.features.length; index++) {
            let pointOnPoly = turf.pointOnFeature(polyFC.features[index].geometry.coordinates);
            let distance = turf.distance(turfPoint, pointOnPoly, { units: 'meters' });
            airports.push(
                {
                    distance,
                    name: polyFC.features[index].properties.name,
                    code: polyFC.features[index].properties.code,
                    coordinates: polyFC.features[index].geometry.coordinates
                }
            );
        }
        return airports.sort((a, b) => {
            return a.distance - b.distance;
        }).slice(0, 3);
    }
    return { ...locations(turfPoint), airports: airports(turfPoint) };
};
