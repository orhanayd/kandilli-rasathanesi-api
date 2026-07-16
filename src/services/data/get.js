/* eslint-disable no-inner-declarations */
const db = require('../../db');
const repositories = require('../../repositories');
const constants = require('../../constants');

module.exports = async (_req, res) => {
	const responseBody = constants.response();
	responseBody.serverloadms = Date.now();
	try {
		const key = `data/earthquake/${res.locals.query.earthquake_id}`;
		const cache = db.nopeRedis.getItem(key);
		if (cache) {
			responseBody.result = cache;
			responseBody.httpStatus = 200;
		} else {
			const query = await repositories.data.get(res.locals.query.earthquake_id);
			if (query) {
				responseBody.httpStatus = 200;
				responseBody.result = query;
			}
			db.nopeRedis.setItem(key, query, 60 * 60 * 24);
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
