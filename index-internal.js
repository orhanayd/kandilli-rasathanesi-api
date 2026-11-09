const express = require('express');
const cors = require('cors');
const logger = require('morgan');

const app = express();
const helpers = require('./src/helpers');
const db = require('./src/db');
const port = 7980;

const cloudflare = require('./src/helpers/cloudflare');

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

// 404 handler
app.use((_req, res) => {
	const response = {
		httpStatus: 404,
		status: false,
		desc: 'No endpoint!',
	};
	return res.status(response.httpStatus).json(response);
});

// Port ancak MongoDB bağlandıktan sonra açılır (ayrıntı: index.js start()).
async function start() {
	const connection = await db.MongoDB.connector();
	if (!connection) {
		console.error('MongoDB bağlantısı kurulamadı, servis başlatılmıyor');
		process.exit(1);
	}
	// index'ler constants/indexes.js ile eşitlenir (eksik oluşturulur, fazla düşürülür); boot'u bloklamaz
	helpers.indexChecker
		.runAll()
		.then((results) => {
			const line = helpers.indexChecker.summary(results);
			if (results.failures.length > 0) {
				console.error(line, results.failures);
			} else {
				console.log(line);
			}
		})
		.catch((error) => console.error('indexes -> hata:', error.message));
	const server = app.listen(port, () => {
		console.log(`Kandilli Internal Service - PORT: ${port}`);
	});
	helpers.gracefulShutdown(server);
	cloudflare.init().catch((error) => console.error('cloudflare.init error:', error.message));
	// geometri önbelleğini boot'ta ısıt, ilk cron çağrısı beklemesin
	setImmediate(() => helpers.earthquakes.warm());
}

start();
