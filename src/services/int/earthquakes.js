/* eslint-disable no-inner-declarations */
const helpers = require('../../helpers');
const repositories = require('../../repositories');
const constants = require('../../constants');

let running = false;

// AFAD penceresi UYARLANABİLİR: normalde son kaydın biraz gerisinden başlar (tipik olarak
// birkaç saat = 1-2 sayfa), kesinti sonrasında ise boşluğu kapatacak kadar geriye uzar.
// Sabit 6 saatlik pencere, 6 saati aşan kesintilerde veriyi kalıcı kaybettirirdi — denetimde
// 28,5 ve 49 saatlik kesintiler görüldü. Üst sınır AFAD'ın saklama penceresine göre: AFAD servisi yalnızca son ~1000
// olayı (~12 gün) tutar ve sayfa başına 1000 kayıt verir, yani 10 günlük pencere de en fazla 1-2 istektir.
// Daha eski veri AFAD'da zaten yok; kesinti 10 günü aşarsa aradaki boşluk AFAD'dan geri alınamaz.
const AFAD_MIN_WINDOW_HOURS = 6;
const AFAD_MAX_WINDOW_HOURS = 10 * 24;
// son kaydın biraz gerisinden başla: sınırda kalan kayıt atlanmasın
const AFAD_OVERLAP_HOURS = 1;
// saat farkı/gecikme payı — pencerenin ucu biraz ileri alınır
const AFAD_LOOKAHEAD_HOURS = 1;

/**
 * AFAD sorgu penceresinin başlangıcı (Europe/Istanbul). DB'deki son AFAD kaydından geriye doğru,
 * en az AFAD_MIN_WINDOW_HOURS en fazla AFAD_MAX_WINDOW_HOURS. UTC'ye çevirme crawler'da yapılır.
 *
 * @returns {Promise<helpers.date.kk_date>}
 */
async function afadWindowStart() {
	const earliest = new helpers.date.kk_date().add(-AFAD_MAX_WINDOW_HOURS, 'hours');
	const latest = new helpers.date.kk_date().add(-AFAD_MIN_WINDOW_HOURS, 'hours');
	try {
		const newest = await repositories.data.latestDateTime(constants.providers.AFAD);
		if (!newest) {
			return latest;
		}
		// date_time Europe/Istanbul duvar saati — kk_date'in global timezone'u ile aynı, dönüşüm gerekmez
		const candidate = new helpers.date.kk_date(newest).add(-AFAD_OVERLAP_HOURS, 'hours');
		if (candidate.isBefore(earliest)) {
			return earliest;
		}
		if (candidate.isAfter(latest)) {
			return latest;
		}
		return candidate;
	} catch (error) {
		console.error(error);
		return latest;
	}
}

module.exports = async (_req, res) => {
	const responseBody = constants.response();
	responseBody.serverloadms = Date.now();

	try {
		async function kandilliImport() {
			try {
				const kandilli_data = await helpers.crawler.kandilli.get();
				await repositories.data.multiSave(kandilli_data.data);
			} catch (error) {
				console.error(error);
			}
		}
		async function afadImport() {
			try {
				// Pencere Europe/Istanbul kk_date olarak verilir; AFAD'ın beklediği UTC biçimine crawler çevirir
				const start = await afadWindowStart();
				const end = new helpers.date.kk_date().add(AFAD_LOOKAHEAD_HOURS, 'hours');
				const afad_data = await helpers.crawler.afad.get(start, end);
				await repositories.data.multiSave(afad_data.data);
			} catch (error) {
				console.error(error);
			}
		}
		async function start() {
			await kandilliImport();
			await afadImport();
		}
		if (running) {
			responseBody.desc = 'already running';
		} else {
			running = true;
			start().finally(() => {
				running = false;
			});
		}
	} catch (error) {
		console.error(error);
		responseBody.desc = error.message || '';
		responseBody.status = false;
		responseBody.httpStatus = 500;
	}
	responseBody.serverloadms = Date.now() - responseBody.serverloadms;
	return res.status(responseBody.httpStatus).json(responseBody);
};
