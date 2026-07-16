/* eslint-disable no-inner-declarations */
const repositories = require('../../repositories');
const constants = require('../../constants');

module.exports = async (_req, res) => {
	const responseBody = constants.response();
	responseBody.serverloadms = Date.now();

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
	responseBody.serverloadms = Date.now() - responseBody.serverloadms;
	return res.status(responseBody.httpStatus).json(responseBody);
};
