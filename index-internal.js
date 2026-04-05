const express = require('express');
const cors = require('cors');
const logger = require('morgan');

const app = express();
const helpers = require('./src/helpers');
const db = require('./src/db');
const port = 7980;

// connectors for db, cache etc.;
const cloudflare = require('./src/helpers/cloudflare');

async function connector() {
	await db.MongoDB.connector();
	await cloudflare.init();
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
app.use(express.json({ limit: 10000 }));
app.use(express.urlencoded({ extended: false }));

// Internal routes only
const intRoutes = require('./src/routes/int');
app.use('/deprem/int', intRoutes);

// Health check endpoint for internal service
app.get('/health', (_req, res) => {
	res.json({
		status: true,
		service: 'kandilli-internal',
		port: port,
		timestamp: new helpers.date.kk_date().format('YYYY-MM-DD HH:mm:ss'),
	});
});

// Error handling middleware
app.use((err, _req, res, next) => {
	if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
		console.error(err);
		const response = {
			status: false,
			desc: err.message || '',
			httpStatus: err.httpStatus || 500,
		};
		return res.status(response.httpStatus).send(response);
	}
	return next();
});

// 404 handler
app.use((_req, res) => {
	const response = {
		httpStatus: 404,
		status: false,
		desc: 'No endpoint!',
	};
	return res.status(response.httpStatus).json(response);
});

app.listen(port, () => {
	console.log(`Kandilli Internal Service - PORT: ${port}`);
});
