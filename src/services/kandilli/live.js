/* eslint-disable no-inner-declarations */
const helpers = require('../../helpers');
const repositories = require('../../repositories');
const db = require('../../db');

module.exports = async (req, res) => {
	const responseBody = {
		status: true,
		httpStatus: 200,
		serverloadms: helpers.date.moment.timestampMS(),
		desc: '',
		metadata: {
			date_starts: helpers.date.moment.moment().tz('Europe/Istanbul').add(-24, 'hours').format('YYYY-MM-DD HH:mm:ss'),
			date_ends: helpers.date.moment.moment().tz('Europe/Istanbul').format('YYYY-MM-DD HH:mm:ss'),
		},
		result: [],
	};
	try {
		let kandilli_data;
		const key = `kandilli/live/${req.query.skip}/${req.query.limit}`;
		const check_noperedis = db.nopeRedis.getItem(key);
		if (check_noperedis) {
			kandilli_data = check_noperedis;
		} else {
			kandilli_data = await repositories.kandilli.list(
				responseBody.metadata.date_starts,
				responseBody.metadata.date_ends,
				req.query.skip,
				req.query.limit,
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
	responseBody.serverloadms = helpers.date.moment.timestampMS() - responseBody.serverloadms;
	return res.status(responseBody.httpStatus).json(responseBody);
};
