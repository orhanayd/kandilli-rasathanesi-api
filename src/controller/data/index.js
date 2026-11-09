const helpers = require('../../helpers');
const constants = require('../../constants');
const repositories = require('../../repositories');

// geoNear yarıçap üst sınırı: dünya çevresinin yarısı (~20.000 km); ötesi küre üzerinde anlamsız
const MAX_RADIUS_METER = 20000000;

// Sayı ya da sayısal string → sonlu sayı; diğer her şey (eksik alan, '', '12abc', Infinity) → NaN
const toFiniteNumber = (value) => {
	if (typeof value === 'number') {
		return Number.isFinite(value) ? value : Number.NaN;
	}
	if (typeof value === 'string' && value.trim() !== '') {
		const parsed = Number(value);
		return Number.isFinite(parsed) ? parsed : Number.NaN;
	}
	return Number.NaN;
};

module.exports.statsGeneral = (req, res, next) => {
	const response = constants.response();
	try {
		req.body = req.body || {};
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
				helpers.errorLogger(error);
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

		res.locals.body = body;
		return next();
	} catch (error) {
		helpers.errorLogger(error);
		response.desc = error.message || '';
		response.httpStatus = error.httpStatus || 500;
		response.status = false;
		return res.status(response.httpStatus).json(response);
	}
};

module.exports.search = async (req, res, next) => {
	const response = constants.response();
	try {
		req.body = req.body || {};
		await repositories.rate.check(req.ip);

		const body = {
			skip: 0,
			limit: 10,
			geoNear: null,
			match: {},
			sort: { date_time: -1 },
		};

		if (typeof req.body.skip === 'number') {
			body.skip = helpers.parseSkip(req.body.skip, 'data.search');
		}

		if (typeof req.body.limit === 'number') {
			body.limit = helpers.parseLimit(req.body.limit, 'data.search');
		}

		// null da typeof 'object' döner; null/dizi/obje olmayan geoNear yok sayılır (diğer alanlarla aynı kural)
		const geoNear = req.body.geoNear;
		if (geoNear && typeof geoNear === 'object' && !Array.isArray(geoNear)) {
			// Sayı ya da sayısal string kabul edilir (eskiden çalışan istekler bozulmasın). Üç alan da zorunludur:
			// eksik/aralık dışı değer MongoDB'ye ulaşırsa 422 yerine 500 dönerdi.
			const lon = toFiniteNumber(geoNear.lon);
			const lat = toFiniteNumber(geoNear.lat);
			if (Number.isNaN(lon) || Number.isNaN(lat)) {
				throw new constants.errors.WrongParam('data.search', 'lat or lon is not a number !');
			}
			if (lon < -180 || lon > 180 || lat < -90 || lat > 90) {
				throw new constants.errors.WrongParam('data.search', 'lon must be between -180 and 180, lat between -90 and 90 !');
			}
			const radiusMeter = toFiniteNumber(geoNear.radiusMeter);
			if (Number.isNaN(radiusMeter)) {
				throw new constants.errors.WrongParam('data.search', 'radiusMeter isNaN !');
			}
			if (radiusMeter <= 0 || radiusMeter > MAX_RADIUS_METER) {
				throw new constants.errors.WrongParam('data.search', `radiusMeter must be between 1 and ${MAX_RADIUS_METER} !`);
			}
			body.geoNear = {
				geojson: { $geoWithin: { $centerSphere: [[lon, lat], helpers.metersToRadios(radiusMeter)] } },
			};
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

		if (req.body.match && typeof req.body.match === 'object') {
			// ondalık korunur: parseInt 4.5'i 4'e kırpıp 4.0 ve üstünü döndürüyordu
			if (typeof req.body.match.mag === 'number') {
				if (!Number.isFinite(req.body.match.mag)) {
					throw new constants.errors.WrongParam('data.search', 'isNaN mag !');
				}
				body.match.mag = { $gte: req.body.match.mag };
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

		res.locals.body = body;
		return next();
	} catch (error) {
		helpers.errorLogger(error);
		response.desc = error.message || '';
		response.httpStatus = error.httpStatus || 500;
		response.status = false;
		return res.status(response.httpStatus).json(response);
	}
};

module.exports.get = async (req, res, next) => {
	const response = constants.response();

	try {
		await repositories.rate.check(req.ip);

		const query = {};

		if (typeof req.query.earthquake_id === 'undefined') {
			throw new constants.errors.MissingField('data.search', 'earthquake_id missing param !');
		}
		query.earthquake_id = req.query.earthquake_id.toString();
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
			if (query.page > 1000) {
				throw new constants.errors.WrongParam('data.sitemap', 'page max 1000 !');
			}
		}

		if (req.query.limit && typeof req.query.limit === 'string') {
			// 0/negatif limit $limit aşamasında MongoDB hatasına (500) düşüyordu
			query.limit = helpers.parseLimit(req.query.limit, 'data.sitemap', 10000);
		}

		query.skip = (query.page - 1) * query.limit;
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
			query.limit = helpers.parseLimit(req.query.limit, 'data.allProviders');
		}
		if (req.query.skip && typeof req.query.skip === 'string') {
			query.skip = helpers.parseSkip(req.query.skip, 'data.allProviders');
		}

		const date_in = req.query.date;
		if (date_in && typeof date_in === 'string') {
			if (!helpers.date.kk_date.isValid(date_in, 'YYYY-MM-DD')) {
				throw new constants.errors.WrongParam('data.allProviders', 'date wrong param !');
			}
			query.date = new helpers.date.kk_date(date_in).startOf('days').format('YYYY-MM-DD HH:mm:ss');
		}
		const date_end_in = req.query.date_end;
		if (date_end_in && typeof date_end_in === 'string') {
			if (!helpers.date.kk_date.isValid(date_end_in, 'YYYY-MM-DD')) {
				throw new constants.errors.WrongParam('data.allProviders', 'date_end wrong param !');
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
