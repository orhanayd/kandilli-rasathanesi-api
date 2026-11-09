const axios = require('axios');
const helpers_crawler = require('./helpers');
// helpers/index.js crawler'ı date'ten önce yüklediği için döngüsel require'a düşmemek adına doğrudan alınır
const { kk_date } = require('../date');

// AFAD resmi event servisi (GET; URL .env'deki AFAD_API — takip edilen dosyalara yazılmaz). Sitenin eski iç
// endpoint'i 2026-10-22'den beri session istiyor (401 session_required) — o yüzden bu servis kullanılıyor. Davranışı:
//  - yalnızca SON ~1000 olayı tutar (kayan pencere, ~12 gün); daha eskisi hiçbir filtreyle dönmez
//  - istek başına en fazla 1000 kayıt döner (limit=5000 bile 1000 verir); fazlası offset ile sayfalanır
//  - start/end UTC ve TAM OLARAK 'YYYY-MM-DDTHH:mm:ss' bekler: '.000Z' ya da 'Z' eklenirse HATA VERMEDEN boş liste döner
const PAGE_SIZE = 1000;
const PAGE_DELAY_MS = 5000; // AFAD'ı yormamak için sayfalar arası bekleme

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Bare 'YYYY-MM-DD' D → 'DT21:00:00' (UTC 21:00 = Türkiye D+1 00:00). Diğer her şey — kk_date örneği ya da
// 'YYYY-MM-DD HH:mm:ss' Europe/Istanbul duvar saati — kk_date ile UTC'ye çevrilip ms/'Z' olmadan biçimlenir
// (yukarıdaki sessiz-boş tuzağı). Çağıranın örneği .tz() ile değişmesin diye kopyası üzerinde çalışılır.
const toFilterValue = (value) => {
	if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
		return `${value}T21:00:00`;
	}
	return new kk_date(value).tz('UTC').format('YYYY-MM-DDTHH:mm:ss');
};

/**
 * AFAD deprem listesi. Sonuç 1000'lik sayfalar halinde, tamamı çekilene kadar döngüyle alınır.
 *
 * @param {String|kk_date} starts YYYY-MM-DD, 'YYYY-MM-DD HH:mm:ss' (Europe/Istanbul) veya kk_date
 * @param {String|kk_date} ends YYYY-MM-DD, 'YYYY-MM-DD HH:mm:ss' (Europe/Istanbul) veya kk_date
 * @param {{maxPages?: Number, dir?: String}} options
 * @returns {Promise<{data: Array, metadata: {total: Number}}>}
 */
module.exports.get = async (starts, ends, options = {}) => {
	const { maxPages = 10, dir = 'asc' } = options;
	try {
		const start = toFilterValue(starts);
		const end = toFilterValue(ends);
		const events = [];
		let page = 0;
		let lastPageFull = false;

		for (; page < maxPages; page++) {
			let request;
			try {
				request = await axios.get(process.env.AFAD_API, {
					params: { start, end, orderby: dir === 'desc' ? 'timedesc' : 'time', limit: PAGE_SIZE, offset: page * PAGE_SIZE },
					headers: { Accept: 'application/json' },
					timeout: 30000,
				});
			} catch (error) {
				// Sayfa ortasında hata: o ana kadar toplananları atma, eksikliği bildirip çık
				console.warn(`afad.get -> sayfa ${page} alınamadı (${error.message}); ${events.length} kayıt korunuyor (${start} - ${end})`);
				break;
			}

			if (!request || !Array.isArray(request.data)) {
				console.warn(`afad.get -> sayfa ${page} beklenmeyen yanıt; ${events.length} kayıt korunuyor (${start} - ${end})`);
				break;
			}
			events.push(...request.data);

			lastPageFull = request.data.length >= PAGE_SIZE;
			if (!lastPageFull) {
				break;
			}
			await sleep(PAGE_DELAY_MS);
		}

		// Sessiz kırpma yapma: sınıra dayandıysak söyle
		if (page >= maxPages && lastPageFull) {
			console.warn(`afad.get -> maxPages(${maxPages}) sınırına ulaşıldı, ${events.length} kayıttan sonrası alınamadı (${start} - ${end})`);
		}

		if (events.length < 1) {
			return { data: [], metadata: { total: 0 } };
		}
		return helpers_crawler.afad_models(events);
	} catch (error) {
		console.error(error);
		return { data: [], metadata: { total: 0 } };
	}
};
