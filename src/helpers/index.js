const net = require('node:net');
const constants = require('../constants');

module.exports.crawler = require('./crawler');
module.exports.date = require('./date');
module.exports.earthquakes = require('./earthquakes');
module.exports.indexChecker = require('./indexChecker');

module.exports.errorLogger = (error) => {
	if (error instanceof constants.errors.TooManyRequest) return;
	console.error(error);
};

/**
 * meter to radius
 *
 * @param {number} meter
 * @returns {Number}
 */
module.exports.metersToRadios = (meter = 0) => {
	try {
		const meters = parseInt(meter, 10);
		// parse edilmiş değer kontrol edilir; girdinin kendisine bakmak sayısal olmayan string'de NaN döndürürdü
		if (Number.isNaN(meters)) {
			return false;
		}
		return (meters * 0.0006213712) / 3963.2;
	} catch (error) {
		console.error(error);
		return false;
	}
};

const PAGINATION = Object.freeze({ MAX_LIMIT: 100, MAX_SKIP: 10000 });
module.exports.PAGINATION = PAGINATION;

// Query string ('25') ya da JSON number (25) kabul edilir. Number için Math.trunc kullanılır: parseInt(1e21) → 1 olurdu.
const toInteger = (value) => (typeof value === 'number' ? Math.trunc(value) : parseInt(value, 10));

/**
 * Liste uçlarının limit doğrulaması — tüm uçlarda tek kural.
 * 1'den küçük limit 422 döner: repository'ler `limit > 0` değilse $limit aşamasını hiç eklemez, yani
 * 0/negatif limit tüm eşleşmeyi (arşivde ~1M kayıt) tek yanıtta döndürmeye çalışırdı.
 * Üst sınırı aşan değer hata vermeden sınıra indirilir.
 *
 * @param {String|Number} value
 * @param {String} operation hata kaynağı (örn. 'kandilli.live')
 * @param {Number} max
 * @returns {Number}
 */
module.exports.parseLimit = (value, operation, max = PAGINATION.MAX_LIMIT) => {
	const limit = toInteger(value);
	if (Number.isNaN(limit)) {
		throw new constants.errors.WrongParam(operation, 'isNaN limit !');
	}
	if (limit < 1) {
		throw new constants.errors.WrongParam(operation, 'limit min 1 !');
	}
	return Math.min(limit, max);
};

/**
 * Liste uçlarının skip doğrulaması — tüm uçlarda tek kural: 0 ile max arası, dışı 422.
 *
 * @param {String|Number} value
 * @param {String} operation hata kaynağı
 * @param {Number} max
 * @returns {Number}
 */
module.exports.parseSkip = (value, operation, max = PAGINATION.MAX_SKIP) => {
	const skip = toInteger(value);
	if (Number.isNaN(skip)) {
		throw new constants.errors.WrongParam(operation, 'isNaN skip !');
	}
	if (skip < 0) {
		throw new constants.errors.WrongParam(operation, 'skip min 0 !');
	}
	if (skip > max) {
		throw new constants.errors.WrongParam(operation, `skip max ${max} !`);
	}
	return skip;
};

/**
 * Kesintisiz reload için kapanış. PM2 reload/stop önce SIGINT gönderir, kill_timeout (varsayılan 1600 ms)
 * dolunca SIGKILL. Node SIGINT'te anında çıktığı için eski worker'da işlenmekte olan istek kopuyordu; ayrıca
 * çıkış anında master'dan yolda olan bağlantı askıda kalıyordu. Burada yeni bağlantı kabulü durdurulur,
 * süren istekler bitirilir, yoldaki bağlantıların başka worker'a aktarılması beklenir, sonra çıkılır.
 * Yerelde PM2 6.0.5 (prod sürümü) ile 100 reload'da 0 hata; önceki sürüm 50 reload'da 2 zaman aşımı veriyordu.
 *
 * @param {import('node:http').Server} server
 * @param {{graceMs?: Number, drainMs?: Number, timeoutMs?: Number}} options graceMs: boştaki keep-alive
 *   bağlantıları kapatmadan önce bekleme; drainMs: sunucu kapandıktan sonra çıkmadan önce bekleme;
 *   timeoutMs: zorla çıkış — PM2 kill_timeout'tan kısa olmalı
 */
module.exports.gracefulShutdown = (server, { graceMs = 500, drainMs = 250, timeoutMs = 1500 } = {}) => {
	let closing = false;
	// Kapanış başladıktan sonra yanıtlanan istekte bağlantı keep-alive'da tutulmaz, yanıttan sonra kapanır.
	// prependListener: express'ten önce çalışmalı — önbellekten senkron dönen yanıtta başlık geç kalmasın.
	server.prependListener('request', (_req, res) => {
		if (closing) {
			res.setHeader('Connection', 'close');
		}
	});
	const shutdown = () => {
		closing = true;
		// http.Server#close() boştaki bağlantıları anında kapatır; az önce kabul edilmiş ama isteği henüz parse
		// edilmemiş soket de "boşta" sayılır. Dinlemeyi net.Server düzeyinde bırakmak mevcut soketlere dokunmaz;
		// cluster master'ı da yeni bağlantıyı bu worker'a vermeyi keser.
		net.Server.prototype.close.call(server, () => {
			// Master, kapandığımızı öğrenmeden hemen önce yola çıkardığı bağlantıyı IPC ile gönderebilir. Worker o
			// mesajı işlerse bağlantıyı reddeder, master da başka worker'a verir; hemen çıkılırsa mesaj okunmaz ve
			// istek askıda kalır (zaman aşımı). Bu yüzden çıkmadan önce kısa süre beklenir (unref değil: bekleme garanti).
			setTimeout(() => process.exit(0), drainMs);
		});
		// Yeni soketlerin isteği gelsin diye bekle; sonra kalan boştaki keep-alive bağlantılarını kapat
		setTimeout(() => {
			server.closeIdleConnections();
			setInterval(() => server.closeIdleConnections(), 50).unref();
		}, graceMs).unref();
		// açık Mongo havuzu ve önbellek zamanlayıcıları event loop'u canlı tutar; PM2 kill_timeout (1600 ms) dolmadan çık
		setTimeout(() => process.exit(0), timeoutMs).unref();
	};
	process.once('SIGINT', shutdown);
	process.once('SIGTERM', shutdown);
};
