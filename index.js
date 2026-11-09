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

// Port ancak MongoDB bağlandıktan sonra açılır: aksi halde boot'un ilk anlarında gelen istekler
// "db connection error" ile 500 alıyordu. PM2 cluster modunda reload, yeni worker dinlemeye başlayana
// kadar eskisini öldürmez — yani bu sıra reload'u gerçekten kesintisiz yapar.
async function start() {
	const connection = await db.MongoDB.connector();
	if (!connection) {
		// bağlantısız dinlemek her isteği 500'e çevirir; çık, PM2 yeniden başlatsın (reload'da eski worker hizmete devam eder)
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
		console.log(`Kandilli Rasathanesi API Service API - PORT: ${port}`);
	});
	helpers.gracefulShutdown(server);
	// Cloudflare listesi hazırlığı dış API çağrısıdır; dinlemeyi bekletmez
	cloudflare.init().catch((error) => console.error('cloudflare.init error:', error.message));
}

start();
