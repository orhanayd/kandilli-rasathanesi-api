const helpers = require('../../helpers');
const repositories = require('../../repositories');
const constants = require('../../constants');

module.exports.live = async (req, res, next) => {
	const response = constants.response();

	try {
		const query = {
			skip: 0,
			limit: 50,
		};
		await repositories.rate.check(req.ip);

		if (req.query.skip && typeof req.query.skip === 'string') {
			query.skip = parseInt(req.query.skip, 10);
			if (Number.isNaN(query.skip)) {
				throw new constants.errors.WrongParam('kandilli.live', 'isNaN skip !');
			}
		}

		if (req.query.limit && typeof req.query.limit === 'string') {
			query.limit = parseInt(req.query.limit, 10);
			if (Number.isNaN(query.limit)) {
				throw new constants.errors.WrongParam('kandilli.live', 'isNaN limit !');
			}
			if (query.limit > 100) {
				query.limit = 100;
			}
		}

		res.locals.query = query;
		return next();
	} catch (error) {
		console.error(error);
		response.desc = error.message || '';
		response.httpStatus = error.httpStatus || 500;
		response.status = false;
		return res.status(response.httpStatus).json(response);
	}
};

module.exports.archive = async (req, res, next) => {
	const response = constants.response();

	try {
		const query = {
			skip: 0,
			limit: 50,
			date: new helpers.date.kk_date().add(-24, 'hours').format('YYYY-MM-DD HH:mm:ss'),
			date_end: new helpers.date.kk_date().format('YYYY-MM-DD HH:mm:ss'),
		};

		await repositories.rate.check(req.ip);

		if (req.query.limit && typeof req.query.limit === 'string') {
			query.limit = parseInt(req.query.limit, 10);
			if (Number.isNaN(query.limit)) {
				throw new constants.errors.WrongParam('kandilli.archive', 'isNaN limit !');
			}
			if (query.limit > 100) {
				query.limit = 100;
			}
		}
		if (req.query.skip && typeof req.query.skip === 'string') {
			query.skip = parseInt(req.query.skip, 10);
			if (Number.isNaN(query.skip)) {
				throw new constants.errors.WrongParam('kandilli.archive', 'isNaN skip !');
			}
		}

		if (req.query.date && typeof req.query.date === 'string') {
			req.query.date = req.query.date.toString();
			if (!helpers.date.kk_date.isValid(req.query.date, 'YYYY-MM-DD')) {
				throw new constants.errors.WrongParam('kandilli.archive', 'date wrong param !');
			}
			query.date = new helpers.date.kk_date(req.query.date).startOf('days').format('YYYY-MM-DD HH:mm:ss');
		}
		if (req.query.date_end && typeof req.query.date_end === 'string') {
			req.query.date_end = req.query.date_end.toString();
			if (!helpers.date.kk_date.isValid(req.query.date_end, 'YYYY-MM-DD')) {
				throw new constants.errors.WrongParam('kandilli.archive', 'date_end wrong param !');
			}
			query.date_end = new helpers.date.kk_date(req.query.date_end).endOf('days').format('YYYY-MM-DD HH:mm:ss');
		}

		res.locals.query = query;
		return next();
	} catch (error) {
		console.error(error);
		response.desc = error.message || '';
		response.httpStatus = error.httpStatus || 500;
		response.status = false;
		return res.status(response.httpStatus).json(response);
	}
};
