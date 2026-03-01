const repositories = require('../../repositories');
const constants = require('../../constants');

module.exports = async (_req, res) => {
	const response = constants.response();
	try {
		await repositories.rate.delete();
		response.desc = 'rate cleanup done';
	} catch (error) {
		console.error(error);
		response.desc = error.message || '';
		response.status = false;
		response.httpStatus = 500;
	}
	return res.status(response.httpStatus).json(response);
};
