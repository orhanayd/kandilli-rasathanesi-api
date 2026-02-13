const helpers = require('../../helpers');
const constants = require('../../constants');
const repositories = require('../../repositories');

module.exports.statsGeneral = (req, res, next) => {
	const response = constants.response();
	try {
		const body = {
			match: {
				date_time: {},
			},
		};
		body.match.provider = constants.providers.KANDILLI;
		body.provider = constants.providers.KANDILLI;

		if (typeof req.body.range !== 'string') {
			throw new constants.errors.MissingField('data.statsGeneral', 'range missing !');
		}
		if (req.body.range in constants.statsRange === false) {
			throw new constants.errors.WrongParam('data.statsGeneral', 'range wrong !');
		}
		body.range = req.body.range;
		if (req.body.range === 'DATE') {
			try {
				body.date = JSON.parse(req.body.date);
			} catch (error) {
				console.error(error);
				throw new constants.errors.ServerError('data.statsGeneral', 'req body date parse error !');
			}
		}
		if (typeof req.body.provider === 'string') {
			if (req.body.provider in constants.providers === false) {
				throw new constants.errors.WrongParam('data.statsGeneral', 'provider wrong !');
			}
			body.match.provider = req.body.provider.toString();
			body.provider = body.match.provider;
		}

		if (typeof req.body.epiCenter === 'string') {
			body.match['location_properties.epiCenter.name'] = req.body.epiCenter.toString();
		}

		if (typeof req.body.types === 'undefined' || Array.isArray(req.body.types) === false) {
			req.body.types = [];
		}
		body.types = [];
		const type_length = req.body.types.length;
		for (let index = 0; index < type_length; index++) {
			if (req.body.types[index] in constants.stats === false) {
				throw new constants.errors.WrongParam('data.statsGeneral', 'type value wrong !');
			}
			body.types.push(req.body.types[index].toString());
		}

		switch (req.body.range) {
			case constants.statsRange.TODAY:
				body.match.date_time = {
					$gte: new helpers.date.kk_date().startOf('days').format('YYYY-MM-DD HH:mm:ss'),
					$lte: new helpers.date.kk_date().endOf('days').format('YYYY-MM-DD HH:mm:ss'),
				};
				break;
			case constants.statsRange.YESTERDAY:
				body.match.date_time = {
					$gte: new helpers.date.kk_date().add(-1, 'days').startOf('days').format('YYYY-MM-DD HH:mm:ss'),
					$lte: new helpers.date.kk_date().add(-1, 'days').endOf('days').format('YYYY-MM-DD HH:mm:ss'),
				};
				break;
			case constants.statsRange.LAST3DAYS:
				body.match.date_time = {
					$gte: new helpers.date.kk_date().add(-3, 'days').startOf('days').format('YYYY-MM-DD HH:mm:ss'),
					$lte: new helpers.date.kk_date().endOf('days').format('YYYY-MM-DD HH:mm:ss'),
				};
				break;
			case constants.statsRange.LAST5DAYS:
				body.match.date_time = {
					$gte: new helpers.date.kk_date().add(-5, 'days').startOf('days').format('YYYY-MM-DD HH:mm:ss'),
					$lte: new helpers.date.kk_date().endOf('days').format('YYYY-MM-DD HH:mm:ss'),
				};
				break;
			case constants.statsRange.LAST7DAYS:
				body.match.date_time = {
					$gte: new helpers.date.kk_date().add(-7, 'days').startOf('days').format('YYYY-MM-DD HH:mm:ss'),
					$lte: new helpers.date.kk_date().endOf('days').format('YYYY-MM-DD HH:mm:ss'),
				};
				break;
			case constants.statsRange.THISMONTH:
				body.match.date_time = {
					$gte: new helpers.date.kk_date().startOf('months').format('YYYY-MM-DD HH:mm:ss'),
					$lte: new helpers.date.kk_date().endOf('months').format('YYYY-MM-DD HH:mm:ss'),
				};
				break;
			case constants.statsRange.LASTMONTH:
				body.match.date_time = {
					$gte: new helpers.date.kk_date().add(-1, 'months').startOf('months').format('YYYY-MM-DD HH:mm:ss'),
					$lte: new helpers.date.kk_date().add(-1, 'months').endOf('months').format('YYYY-MM-DD HH:mm:ss'),
				};
				break;
			case constants.statsRange.LAST2MONTHS:
				body.match.date_time = {
					$gte: new helpers.date.kk_date().add(-2, 'months').startOf('months').format('YYYY-MM-DD HH:mm:ss'),
					$lte: new helpers.date.kk_date().endOf('months').format('YYYY-MM-DD HH:mm:ss'),
				};
				break;
			case constants.statsRange.LAST3MONTHS:
				body.match.date_time = {
					$gte: new helpers.date.kk_date().add(-3, 'months').startOf('months').format('YYYY-MM-DD HH:mm:ss'),
					$lte: new helpers.date.kk_date().endOf('months').format('YYYY-MM-DD HH:mm:ss'),
				};
				break;
			case constants.statsRange.DATE: {
				const total = new helpers.date.kk_date(body.date.starts_date).diff(body.date.ends_date, 'days');
				if (total > 7) {
					throw new constants.errors.WrongParam('data.statsGeneral', 'date range cant be big than 7 days !');
				}
				body.match.date_time = {
					$gte: new helpers.date.kk_date(body.date.starts_date).startOf('days').format('YYYY-MM-DD HH:mm:ss'),
					$lte: new helpers.date.kk_date(body.date.ends_date).endOf('days').format('YYYY-MM-DD HH:mm:ss'),
				};
				break;
			}
			default:
				throw new constants.errors.WrongParam('data.statsGeneral', 'no range type !');
		}

		req.body = body;
		return next();
	} catch (error) {
		console.error(error);
		response.desc = error.message || '';
		response.httpStatus = error.httpStatus || 500;
		response.status = false;
		return res.status(response.httpStatus).json(response);
	}
};

module.exports.search = (req, res, next) => {
	const response = constants.response();
	try {
		const body = {
			skip: 0,
			limit: 10,
			geoNear: null,
			match: {},
			sort: { date_time: -1 },
		};

		if (typeof req.body.skip === 'number') {
			body.skip = parseInt(req.body.skip, 10);
			if (Number.isNaN(body.skip)) {
				throw new constants.errors.WrongParam('data.search', 'isNaN skip !');
			}
		}

		if (typeof req.body.limit === 'number') {
			body.limit = parseInt(req.body.limit, 10);
			if (Number.isNaN(body.limit)) {
				throw new constants.errors.WrongParam('data.search', 'isNaN limit !');
			}
			if (body.limit > 100) {
				body.limit = 100;
			}
		}

		if (typeof req.body.geoNear === 'object') {
			if (typeof req.body.geoNear.lon !== 'number' && typeof req.body.geoNear.lat !== 'number') {
				throw new constants.errors.WrongParam('data.search', 'lat or lon is not a number !');
			}
			if (typeof req.body.geoNear.radiusMeter !== 'number') {
				req.body.geoNear.radiusMeter = parseInt(req.body.geoNear.radiusMeter, 10);
				if (Number.isNaN(req.body.geoNear.radiusMeter)) {
					throw new constants.errors.WrongParam('data.search', 'radiusMeter isNaN !');
				}
			}
			body.geoNear = {
				geojson: { $geoWithin: { $centerSphere: [[], 0] } },
			};
			body.geoNear.geojson['$geoWithin']['$centerSphere'][0][0] = parseFloat(req.body.geoNear.lon);
			body.geoNear.geojson['$geoWithin']['$centerSphere'][0][1] = parseFloat(req.body.geoNear.lat);
			body.geoNear.geojson['$geoWithin']['$centerSphere'][1] = helpers.metersToRadios(req.body.geoNear.radiusMeter);
			if (body.geoNear.geojson['$geoWithin']['$centerSphere'][1] === false) {
				throw new constants.errors.WrongParam('data.search', 'meters is false !');
			}
		}

		if (typeof req.body.sort === 'string') {
			if (req.body.sort === 'date_1') {
				body.sort = { date_time: 1 };
			} else if (req.body.sort === 'date_-1') {
				body.sort = { date_time: -1 };
			} else if (req.body.sort === 'mag_1') {
				body.sort = { mag: 1 };
			} else if (req.body.sort === 'mag_-1') {
				body.sort = { mag: -1 };
			}
		}

		if (typeof req.body.provider === 'string' && constants.providersList.includes(req.body.provider)) {
			body.match.provider = req.body.provider.toString();
		}

		if (typeof req.body.match === 'object') {
			if (req.body.match.mag && typeof req.body.match.mag === 'number') {
				body.match.mag = { $gte: parseInt(req.body.match.mag, 10) };
				if (Number.isNaN(body.match.mag['$gte'])) {
					throw new constants.errors.WrongParam('data.search', 'isNaN mag !');
				}
			}
			if (typeof req.body.match.date_starts === 'string' && typeof req.body.match.date_ends === 'string') {
				if (
					!helpers.date.kk_date.isValid(req.body.match.date_starts, 'YYYY-MM-DD HH:mm:ss') ||
					!helpers.date.kk_date.isValid(req.body.match.date_ends, 'YYYY-MM-DD HH:mm:ss')
				) {
					throw new constants.errors.WrongParam('data.search', 'date_starts or date_ends is not valid !');
				}
				body.match.date_time = {
					$gte: req.body.match.date_starts.toString(),
					$lte: req.body.match.date_ends.toString(),
				};
			}

			if (typeof req.body.match.cityCode === 'number') {
				body.match['location_properties.epiCenter.cityCode'] = parseInt(req.body.match.cityCode, 10);
				if (Number.isNaN(body.match['location_properties.epiCenter.cityCode'])) {
					throw new constants.errors.WrongParam('data.search', 'cityCode isNaN !');
				}
			}
		}

		req.body = body;
		return next();
	} catch (error) {
		console.error(error);
		response.desc = error.message || '';
		response.httpStatus = error.httpStatus || 500;
		response.status = false;
		return res.status(response.httpStatus).json(response);
	}
};

module.exports.get = (req, res, next) => {
	const response = constants.response();

	try {
		const query = {};

		if (typeof req.query.earthquake_id === 'undefined') {
			throw new constants.errors.MissingField('data.search', 'earthquake_id missing param !');
		}
		query.earthquake_id = req.query.earthquake_id.toString();
		req.query = query;
		return next();
	} catch (error) {
		console.error(error);
		response.desc = error.message || '';
		response.httpStatus = error.httpStatus || 500;
		response.status = false;
		return res.status(response.httpStatus).json(response);
	}
};

module.exports.sitemap = (req, res, next) => {
	const response = constants.response();
	try {
		const query = {
			page: 1,
			limit: 5000,
		};

		if (req.query.page && typeof req.query.page === 'string') {
			query.page = parseInt(req.query.page, 10);
			if (Number.isNaN(query.page) || query.page < 1) {
				throw new constants.errors.WrongParam('data.sitemap', 'page wrong param !');
			}
		}

		if (req.query.limit && typeof req.query.limit === 'string') {
			query.limit = parseInt(req.query.limit, 10);
			if (Number.isNaN(query.limit)) {
				throw new constants.errors.WrongParam('data.sitemap', 'isNaN limit !');
			}
			if (query.limit > 10000) {
				query.limit = 10000;
			}
		}

		query.skip = (query.page - 1) * query.limit;
		req.query = query;
		return next();
	} catch (error) {
		console.error(error);
		response.desc = error.message || '';
		response.httpStatus = error.httpStatus || 500;
		response.status = false;
		return res.status(response.httpStatus).json(response);
	}
};

module.exports.allProviders = async (req, res, next) => {
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
				throw new constants.errors.WrongParam('afad.archive', 'isNaN limit !');
			}
			if (query.limit > 100) {
				query.limit = 100;
			}
		}
		if (req.query.skip && typeof req.query.skip === 'string') {
			query.skip = parseInt(req.query.skip, 10);
			if (Number.isNaN(query.skip)) {
				throw new constants.errors.WrongParam('afad.archive', 'isNaN skip !');
			}
		}

		if (req.query.date && typeof req.query.date === 'string') {
			req.query.date = req.query.date.toString();
			if (!helpers.date.kk_date.isValid(req.query.date, 'YYYY-MM-DD')) {
				throw new constants.errors.WrongParam('afad.archive', 'date wrong param !');
			}
			query.date = new helpers.date.kk_date(req.query.date).startOf('days').format('YYYY-MM-DD HH:mm:ss');
		}
		if (req.query.date_end && typeof req.query.date_end === 'string') {
			req.query.date_end = req.query.date_end.toString();
			if (!helpers.date.kk_date.isValid(req.query.date_end, 'YYYY-MM-DD')) {
				throw new constants.errors.WrongParam('afad.archive', 'date_end wrong param !');
			}
			query.date_end = new helpers.date.kk_date(req.query.date_end).endOf('days').format('YYYY-MM-DD HH:mm:ss');
		}

		req.query = query;
		return next();
	} catch (error) {
		console.error(error);
		response.desc = error.message || '';
		response.httpStatus = error.httpStatus || 500;
		response.status = false;
		return res.status(response.httpStatus).json(response);
	}
};
