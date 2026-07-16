/* eslint-disable no-inner-declarations */
const constants = require('../../constants');
const db = require('../../db');
const repositories = require('../../repositories');

module.exports = async (_req, res) => {
	const responseBody = constants.response();
	responseBody.httpStatus = 404;
	responseBody.serverloadms = Date.now();
	responseBody.result = null;

	try {
		let key = `data/stats/${res.locals.body.provider}/${res.locals.body.range}`;
		if (res.locals.body.match['location_properties.epiCenter.name']) {
			key += `/${res.locals.body.match['location_properties.epiCenter.name']}`;
		}
		if (res.locals.body.range === constants.statsRange.DATE) {
			key += `/${res.locals.body.date.starts_date}/${res.locals.body.date.ends_date}`;
		}
		if (res.locals.body.types.length > 0) {
			key += `/${res.locals.body.types.toString()}`;
		}
		const cache = db.nopeRedis.getItem(key);
		if (cache) {
			responseBody.result = cache;
			responseBody.httpStatus = 200;
		} else {
			if (res.locals.body.types.length === 0) {
				responseBody.result = {
					dateBy: await repositories.data.stats.dateBy(res.locals.body.match),
					hourBy: await repositories.data.stats.hourBy(res.locals.body.match),
					epiCenterBy: await repositories.data.stats.epiCenterBy(res.locals.body.match),
					airportsBy: await repositories.data.stats.airportsBy(res.locals.body.match),
					magBy: await repositories.data.stats.magBy(res.locals.body.match),
					dateByEarthQuakes: await repositories.data.stats.dateByEarthQuakes(res.locals.body.match),
				};
			} else {
				responseBody.result = {};
				if (res.locals.body.types.includes(constants.stats.dateBy)) {
					responseBody.result.dateBy = await repositories.data.stats.dateBy(res.locals.body.match);
				}
				if (res.locals.body.types.includes(constants.stats.hourBy)) {
					responseBody.result.hourBy = await repositories.data.stats.hourBy(res.locals.body.match);
				}
				if (res.locals.body.types.includes(constants.stats.epiCenterBy)) {
					responseBody.result.epiCenterBy = await repositories.data.stats.epiCenterBy(res.locals.body.match);
				}
				if (res.locals.body.types.includes(constants.stats.airportsBy)) {
					responseBody.result.airportsBy = await repositories.data.stats.airportsBy(res.locals.body.match);
				}
				if (res.locals.body.types.includes(constants.stats.magBy)) {
					responseBody.result.magBy = await repositories.data.stats.magBy(res.locals.body.match);
				}
				if (res.locals.body.types.includes(constants.stats.dateByEarthQuakes)) {
					responseBody.result.dateByEarthQuakes = await repositories.data.stats.dateByEarthQuakes(res.locals.body.match);
				}
			}
			responseBody.httpStatus = 200;
			db.nopeRedis.setItem(key, responseBody.result, 5 * 60);
		}
	} catch (error) {
		console.error(error);
		responseBody.desc = error.message || '';
		responseBody.status = false;
		responseBody.httpStatus = 500;
	}
	responseBody.serverloadms = Date.now() - responseBody.serverloadms;
	return res.status(responseBody.httpStatus).json(responseBody);
};
