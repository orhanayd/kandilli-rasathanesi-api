/* eslint-disable no-inner-declarations */
const helpers = require('../../helpers');
const repositories = require('../../repositories');
const constants = require('../../constants');

module.exports = async (_req, res) => {
	const responseBody = constants.response();

	try {
		const data = await repositories.data.search(
			res.locals.body.match,
			res.locals.body.geoNear,
			res.locals.body.sort,
			res.locals.body.skip,
			res.locals.body.limit,
			null,
		);
		responseBody.result = data;
	} catch (error) {
		console.error(error);
		responseBody.desc = error.message || '';
		responseBody.status = false;
		responseBody.httpStatus = 500;
	}
	responseBody.serverloadms = new helpers.date.kk_date().format('x') - responseBody.serverloadms;
	return res.status(responseBody.httpStatus).json(responseBody);
};
