const helpers = require('../../helpers');
const db = require('../../db');
const repositories = require('../../repositories');
const constants = require('../../constants');

module.exports = async (req, res) => {
	const responseBody = constants.response();

	try {
		const key = `data/sitemap/${req.query.page}/${req.query.limit}`;
		const cache = db.nopeRedis.getItem(key);
		if (cache) {
			responseBody.result = cache;
			responseBody.httpStatus = 200;
		} else {
			const [data, total] = await Promise.all([repositories.data.sitemap(req.query.skip, req.query.limit), repositories.data.sitemapCount()]);
			responseBody.result = {
				page: req.query.page,
				totalPages: Math.ceil(total / req.query.limit),
				total,
				data,
			};
			responseBody.httpStatus = 200;
			db.nopeRedis.setItem(key, responseBody.result, 5 * 60);
		}
	} catch (error) {
		console.error(error);
		responseBody.desc = error.message || '';
		responseBody.status = false;
		responseBody.httpStatus = 500;
	}
	responseBody.serverloadms = new helpers.date.kk_date().format('x') - responseBody.serverloadms;
	return res.status(responseBody.httpStatus).json(responseBody);
};
