/* eslint-disable no-inner-declarations */
const helpers = require('../../helpers');
const repositories = require('../../repositories');
const constants = require('../../constants');
const db = require('../../db');

module.exports = async (_req, res) => {
	const responseBody = constants.response();
	responseBody.serverloadms = Date.now();
	responseBody.metadata = {
		date_starts: new helpers.date.kk_date().add(-24, 'hours').format('YYYY-MM-DD HH:mm:ss'),
		date_ends: new helpers.date.kk_date().format('YYYY-MM-DD HH:mm:ss'),
	};
	responseBody.result = [];

	try {
		let afad_data = false;
		const key = `afad/live/${res.locals.query.skip}/${res.locals.query.limit}`;
		const check_noperedis = db.nopeRedis.getItem(key);
		if (check_noperedis) {
			afad_data = check_noperedis;
		} else {
			afad_data = await repositories.afad.list(
				responseBody.metadata.date_starts,
				responseBody.metadata.date_ends,
				res.locals.query.skip,
				res.locals.query.limit,
				{
					date_time: -1,
				},
			);
			db.nopeRedis.setItem(key, afad_data, 30);
		}
		if (!afad_data) {
			responseBody.status = false;
			responseBody.desc = 'Veri alınamadı!';
		}
		responseBody.result = afad_data.data;
		responseBody.metadata = { ...responseBody.metadata, ...afad_data.metadata[0] };
	} catch (error) {
		console.error(error);
		responseBody.desc = error.message || '';
		responseBody.status = false;
		responseBody.httpStatus = 500;
	}
	responseBody.serverloadms = Date.now() - responseBody.serverloadms;
	return res.status(responseBody.httpStatus).json(responseBody);
};
