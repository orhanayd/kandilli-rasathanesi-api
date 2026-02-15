/* eslint-disable no-inner-declarations */
const helpers = require('../../helpers');
const repositories = require('../../repositories');
const constants = require('../../constants');
const db = require('../../db');

module.exports = async (_req, res) => {
	const responseBody = constants.response();
	responseBody.serverloadms = new helpers.date.kk_date().format('x');
	responseBody.metadata = {
		date_starts: new helpers.date.kk_date().add(-24, 'hours').format('YYYY-MM-DD HH:mm:ss'),
		date_ends: new helpers.date.kk_date().format('YYYY-MM-DD HH:mm:ss'),
	};
	responseBody.result = [];

	try {
		let kandilli_data = false;
		const key = `kandilli/live/${res.locals.query.skip}/${res.locals.query.limit}`;
		const check_noperedis = db.nopeRedis.getItem(key);
		if (check_noperedis) {
			kandilli_data = check_noperedis;
		} else {
			kandilli_data = await repositories.kandilli.list(
				responseBody.metadata.date_starts,
				responseBody.metadata.date_ends,
				res.locals.query.skip,
				res.locals.query.limit,
				{ date_time: -1 },
			);
			db.nopeRedis.setItem(key, kandilli_data, 30);
		}
		if (!kandilli_data) {
			responseBody.status = false;
			responseBody.desc = 'Veri alınamadı!';
		}
		responseBody.result = kandilli_data.data;
		responseBody.metadata = { ...responseBody.metadata, ...kandilli_data.metadata[0] };
	} catch (error) {
		console.error(error);
		responseBody.desc = error.message || '';
		responseBody.status = false;
		responseBody.httpStatus = 500;
	}
	responseBody.serverloadms = new helpers.date.kk_date().format('x') - responseBody.serverloadms;
	return res.status(responseBody.httpStatus).json(responseBody);
};
