const express = require('express');
const cors = require('cors');
const logger = require('morgan');
const expressJSDocSwagger = require('express-jsdoc-swagger');

const app = express();
const middlewares = require('./src/middlewares');
const helpers = require('./src/helpers');
const db = require('./src/db');
const constants = require('./src/constants');
const port = 7979;

// connectors for db, cache etc.;
const repositories = require('./src/repositories');

const cloudflare = require('./src/helpers/cloudflare');

async function connector() {
	await db.MongoDB.connector();
	// index kurulumu boot'u bloklamaz; her index için kuruldu / zaten kurulu / kurulamadı loglanır
	repositories.ban.createIndex();
	repositories.rate.createIndex();
	repositories.data.createIndexes();
	await cloudflare.init();
}

connector();

app.set('trust proxy', true);
app.use((req, _res, next) => {
	const ipFromCF = req.headers['cf-connecting-ip'];
	if (ipFromCF) {
		Object.defineProperty(req, 'ip', { value: ipFromCF, configurable: true, enumerable: true });
	}
	next();
});

logger.token('real-ip', (req) => req.ip);
// log zaman damgası saniyede bir kez formatlanır
let datetimeCache = { sec: 0, str: '' };
logger.token('datetime', () => {
	const sec = Math.floor(Date.now() / 1000);
	if (sec !== datetimeCache.sec) {
		datetimeCache = { sec, str: new helpers.date.kk_date().format('YYYY-MM-DD HH:mm:ss') };
	}
	return datetimeCache.str;
});

app.use(cors());
app.use(logger(':datetime - :real-ip - :method :url :status :response-time ms'));
app.use(middlewares.ban);
app.use(express.json({ limit: 10000 }));
app.use(express.urlencoded({ extended: false }));

// Add timeout middleware (configurable via REQUEST_TIMEOUT_MS env var, default 30 seconds)
app.use(middlewares.timeout(constants.CONFIG.REQUEST_TIMEOUT_MS));

expressJSDocSwagger(app)(middlewares.swagger);

//routes;
app.use(require('./src/routes'));
app.use((err, _req, res, next) => {
	if (res.headersSent) {
		return next(err);
	}
	console.error(err);
	const response = {
		status: false,
		desc: err.message || '',
		httpStatus: err.httpStatus || err.status || err.statusCode || 500,
	};
	return res.status(response.httpStatus).json(response);
});

/**
 * 404
 */
app.use((_req, res) => {
	const response = {
		httpStatus: 404,
		status: false,
	};
	response.desc = 'No endpoint!';
	return res.status(response.httpStatus).json(response);
});

app.listen(port, () => {
	console.log(`Kandilli Rasathanesi API Service API - PORT: ${port}`);
});
