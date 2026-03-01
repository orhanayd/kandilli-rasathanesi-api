const constants = require('../constants');
const repositories = require('../repositories');
const helpers = require('../helpers');

module.exports = async (req, res, next) => {
	const response = constants.response();

	try {
		const isBanned = await repositories.ban.check(req.ip);

		if (isBanned) {
			response.desc = 'Your IP has been banned due to rate limit violation.';
			response.status = false;
			response.httpStatus = 403;
			return res.status(response.httpStatus).json(response);
		}

		return next();
	} catch (error) {
		helpers.errorLogger(error);
		response.desc = error.message || '';
		response.status = false;
		response.httpStatus = error.httpStatus || 500;
		return res.status(response.httpStatus).json(response);
	}
};
