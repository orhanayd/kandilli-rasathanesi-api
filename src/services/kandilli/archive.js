/* eslint-disable no-inner-declarations */
const helpers = require('../../helpers');
const repositories = require('../../repositories');
const constants = require('../../constants');
const db = require('../../db');

module.exports = async (_req, res) => {
	const responseBody = constants.response();
	responseBody.serverloadms = new helpers.date.kk_date().format('x');
	responseBody.metadata = {};
	responseBody.result = [];
	try {
		const key = `kandilli/archive/${res.locals.query.date}/${res.locals.query.date_end}/${res.locals.query.skip}/${res.locals.query.limit}`;
		let kandilli_data = db.nopeRedis.getItem(key);
		if (!kandilli_data) {
			kandilli_data = await repositories.kandilli.list(
				res.locals.query.date,
				res.locals.query.date_end,
				res.locals.query.skip,
				res.locals.query.limit,
			);
			if (kandilli_data) {
				db.nopeRedis.setItem(key, kandilli_data, 10 * 60);
			}
		}
		if (!kandilli_data) {
			responseBody.status = false;
			responseBody.desc = 'Veri alınamadı!';
		}
		responseBody.result = kandilli_data.data;
		responseBody.metadata = kandilli_data.metadata[0];
	} catch (error) {
		console.error(error);
		responseBody.desc = error.message || '';
		responseBody.status = false;
		responseBody.httpStatus = 500;
	}
	responseBody.serverloadms = new helpers.date.kk_date().format('x') - responseBody.serverloadms;
	return res.status(responseBody.httpStatus).json(responseBody);
};
