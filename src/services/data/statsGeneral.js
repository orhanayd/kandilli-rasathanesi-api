/* eslint-disable no-inner-declarations */
const helpers = require('../../helpers');
const constants = require('../../constants');
const db = require('../../db');
const repositories = require('../../repositories');

module.exports = async (req, res) => {
	const responseBody = {
		status: true,
		httpStatus: 404,
		serverloadms: helpers.date.moment.timestampMS(),
		desc: '',
		result: null,
	};
	try {
		let key = `data/stats/${req.body.provider}/${req.body.range}`;
		if (req.body.match['location_properties.epiCenter.name']) {
			key += `/${req.body.match['location_properties.epiCenter.name']}`;
		}
		if (req.body.types.length > 0) {
			key += `/${req.body.types.toString()}`;
		}
		const cache = db.nopeRedis.getItem(key);
		if (cache) {
			responseBody.result = cache;
			responseBody.httpStatus = 200;
		} else {
			if (req.body.types.length === 0) {
				responseBody.result = {
					dateBy: await repositories.data.stats.dateBy(req.body.match),
					hourBy: await repositories.data.stats.hourBy(req.body.match),
					epiCenterBy: await repositories.data.stats.epiCenterBy(req.body.match),
					airportsBy: await repositories.data.stats.airportsBy(req.body.match),
					magBy: await repositories.data.stats.magBy(req.body.match),
					dateByEarthQuakes: await repositories.data.stats.dateByEarthQuakes(req.body.match),
				};
			} else {
				responseBody.result = {};
				if (req.body.types.includes(constants.stats.dateBy)) {
					responseBody.result.dateBy = await repositories.data.stats.dateBy(req.body.match);
				}
				if (req.body.types.includes(constants.stats.hourBy)) {
					responseBody.result.hourBy = await repositories.data.stats.hourBy(req.body.match);
				}
				if (req.body.types.includes(constants.stats.epiCenterBy)) {
					responseBody.result.epiCenterBy = await repositories.data.stats.epiCenterBy(req.body.match);
				}
				if (req.body.types.includes(constants.stats.airportsBy)) {
					responseBody.result.airportsBy = await repositories.data.stats.airportsBy(req.body.match);
				}
				if (req.body.types.includes(constants.stats.magBy)) {
					responseBody.result.magBy = await repositories.data.stats.magBy(req.body.match);
				}
				if (req.body.types.includes(constants.stats.dateByEarthQuakes)) {
					responseBody.result.dateByEarthQuakes = await repositories.data.stats.dateByEarthQuakes(req.body.match);
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
	responseBody.serverloadms = helpers.date.moment.timestampMS() - responseBody.serverloadms;
	return res.status(responseBody.httpStatus).json(responseBody);
};
