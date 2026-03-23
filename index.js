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

async function connector() {
	await db.MongoDB.connector();
	await repositories.ban.createIndex();
	await repositories.rate.createIndex();
}

connector();

app.set('trust proxy', true);
app.use((req, _res, next) => {
	const ipFromExpress = req.ip;
	const ipFromCF = req.headers['cf-connecting-ip'];
	req.ip = ipFromCF || ipFromExpress;
	next();
});

logger.token('real-ip', (req) => req.ip);
logger.token('datetime', () => new helpers.date.kk_date().format('YYYY-MM-DD HH:mm:ss'));

app.use(cors());
app.use(logger(':datetime - :real-ip - :method :url :status :response-time ms'));
app.use(middlewares.ban);
app.use(express.json({ limit: 10000 }));
app.use(express.urlencoded({ extended: false }));

// Add timeout middleware (configurable via REQUEST_TIMEOUT_MS env var, default 30 seconds)
app.use(middlewares.timeout(constants.CONFIG.REQUEST_TIMEOUT_MS));

expressJSDocSwagger(app)(middlewares.swagger);
app.use(express.json({ limit: '50mb' }));

//routes;
app.use(require('./src/routes'));
app.use((err, _req, res, next) => {
	if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
		console.error(err);
		const response = {
			status: false,
			desc: err.message || '',
			httpStatus: err.httpStatus || 500,
		};
		return res.status(response.httpStatus).send(response); // Bad request
	}
	return next();
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
