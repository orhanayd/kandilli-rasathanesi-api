/* eslint-disable no-inner-declarations */
const repositories = require('../../repositories');
const constants = require('../../constants');
const db = require('../../db');

module.exports = async (_req, res) => {
	const responseBody = constants.response();
	responseBody.serverloadms = Date.now();
	responseBody.metadata = {};
	responseBody.result = [];
	try {
		const key = `afad/archive/${res.locals.query.date}/${res.locals.query.date_end}/${res.locals.query.skip}/${res.locals.query.limit}`;
		let afad_data = db.nopeRedis.getItem(key);
		if (!afad_data) {
			afad_data = await repositories.afad.list(res.locals.query.date, res.locals.query.date_end, res.locals.query.skip, res.locals.query.limit);
			if (afad_data) {
				db.nopeRedis.setItem(key, afad_data, 10 * 60);
			}
		}
		if (!afad_data) {
			responseBody.status = false;
			responseBody.desc = 'Veri alınamadı!';
		}
		responseBody.result = afad_data.data;
		responseBody.metadata = afad_data.metadata[0];
	} catch (error) {
		console.error(error);
		responseBody.desc = error.message || '';
		responseBody.status = false;
		responseBody.httpStatus = 500;
	}
	responseBody.serverloadms = Date.now() - responseBody.serverloadms;
	return res.status(responseBody.httpStatus).json(responseBody);
};
