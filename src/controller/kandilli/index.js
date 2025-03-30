const helpers = require('../../helpers');

module.exports.live = (req, res, next) => {
	const response = {
		status: true,
		httpStatus: 200,
		desc: '',
	};
	try {
		const query = {
			skip: 0,
			limit: 100,
		};

		if (req.query.skip && typeof req.query.skip === 'string') {
			query.skip = parseInt(req.query.skip, 10);
			if (Number.isNaN(query.skip)) {
				throw new Error('isNaN skip!');
			}
		}

		if (req.query.limit && typeof req.query.limit === 'string') {
			query.limit = parseInt(req.query.limit, 10);
			if (Number.isNaN(query.limit)) {
				throw new Error('isNaN limit!');
			}
		}

		req.query = query;
		return next();
	} catch (error) {
		console.error(error);
		response.desc = error.message || '';
		response.httpStatus = 500;
		response.status = false;
		return res.status(response.httpStatus).json(response);
	}
};

module.exports.archive = (req, res, next) => {
	const response = {
		status: true,
		httpStatus: 200,
		desc: '',
	};
	try {
		const query = {
			skip: 0,
			limit: 100,
			date: helpers.date.moment.moment().tz('Europe/Istanbul').add(-24, 'hours').format('YYYY-MM-DD HH:mm:ss'),
			date_end: helpers.date.moment.moment().tz('Europe/Istanbul').format('YYYY-MM-DD HH:mm:ss'),
		};

		if (req.query.limit && typeof req.query.limit === 'string') {
			query.limit = parseInt(req.query.limit, 10);
			if (Number.isNaN(query.limit)) {
				throw new Error('isNaN limit!');
			}
			if (query.limit > 1000) {
				query.limit = 1000;
			}
		}
		if (req.query.skip && typeof req.query.skip === 'string') {
			query.skip = parseInt(req.query.skip, 10);
			if (Number.isNaN(query.skip)) {
				throw new Error('isNaN skip!');
			}
		}

		if (req.query.date && typeof req.query.date === 'string') {
			req.query.date = req.query.date.toString();
			if (!helpers.date.moment.isValid(req.query.date, 'YYYY-MM-DD')) {
				throw new Error('date wrong param!');
			}
			query.date = helpers.date.moment.moment(req.query.date).startOf('day').format('YYYY-MM-DD HH:mm:ss');
		}
		if (req.query.date_end && typeof req.query.date_end === 'string') {
			req.query.date_end = req.query.date_end.toString();
			if (!helpers.date.moment.isValid(req.query.date_end, 'YYYY-MM-DD')) {
				throw new Error('date_end wrong param!');
			}
			query.date_end = helpers.date.moment.moment(req.query.date_end).endOf('day').format('YYYY-MM-DD HH:mm:ss');
		}

		req.query = query;
		return next();
	} catch (error) {
		console.error(error);
		response.desc = error.message || '';
		response.httpStatus = 500;
		response.status = false;
		return res.status(response.httpStatus).json(response);
	}
};
