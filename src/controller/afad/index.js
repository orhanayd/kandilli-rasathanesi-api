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
			query.skip = helpers.parseSkip(req.query.skip, 'afad.live');
		}

		if (req.query.limit && typeof req.query.limit === 'string') {
			query.limit = helpers.parseLimit(req.query.limit, 'afad.live');
		}

		res.locals.query = query;
		return next();
	} catch (error) {
		helpers.errorLogger(error);
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
			query.limit = helpers.parseLimit(req.query.limit, 'afad.archive');
		}
		if (req.query.skip && typeof req.query.skip === 'string') {
			query.skip = helpers.parseSkip(req.query.skip, 'afad.archive');
		}

		const date_in = req.query.date;
		if (date_in && typeof date_in === 'string') {
			if (!helpers.date.kk_date.isValid(date_in, 'YYYY-MM-DD')) {
				throw new constants.errors.WrongParam('afad.archive', 'date wrong param !');
			}
			query.date = new helpers.date.kk_date(date_in).startOf('days').format('YYYY-MM-DD HH:mm:ss');
		}
		const date_end_in = req.query.date_end;
		if (date_end_in && typeof date_end_in === 'string') {
			if (!helpers.date.kk_date.isValid(date_end_in, 'YYYY-MM-DD')) {
				throw new constants.errors.WrongParam('afad.archive', 'date_end wrong param !');
			}
			query.date_end = new helpers.date.kk_date(date_end_in).endOf('days').format('YYYY-MM-DD HH:mm:ss');
		}

		res.locals.query = query;
		return next();
	} catch (error) {
		helpers.errorLogger(error);
		response.desc = error.message || '';
		response.httpStatus = error.httpStatus || 500;
		response.status = false;
		return res.status(response.httpStatus).json(response);
	}
};
