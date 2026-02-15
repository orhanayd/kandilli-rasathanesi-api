const helpers = require('../../helpers');
const db = require('../../db');
const repositories = require('../../repositories');
const constants = require('../../constants');

module.exports = async (_req, res) => {
	const responseBody = constants.response();

	try {
		const key = `data/sitemap/${res.locals.query.page}/${res.locals.query.limit}`;
		const cache = db.nopeRedis.getItem(key);
		if (cache) {
			responseBody.result = cache;
			responseBody.httpStatus = 200;
		} else {
			const [data, total] = await Promise.all([
				repositories.data.sitemap(res.locals.query.skip, res.locals.query.limit),
				repositories.data.sitemapCount(),
			]);
			responseBody.result = {
				page: res.locals.query.page,
				totalPages: Math.ceil(total / res.locals.query.limit),
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
