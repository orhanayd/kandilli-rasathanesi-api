const helpers = require('../../helpers');
const constants = require('../../constants');
const earthquakes = require('../earthquakes');

// Kandilli'nin `lokasyon` alanı 50 karakterlik sabit genişlikte bir yer adı + kalite bayrağından oluşur:
//   "IRAN                                              İlksel"
//   "AKDENIZ (DOGU)                                    Otomatik"
//   "EGE DENIZI                                        REVIZE01   (2026.08.17 11:53:56)"
// Yer adı 50 karakteri doldurduğunda araya boşluk girmez, bayrak yapışık gelir; bu yüzden ayraç `\s*`.
// Eski `split(')')` mantığı yalnızca "X (SEHIR) REVIZE01 (tarih)" biçimini yakalıyor, deniz/yurtdışı
// başlıklarında bayrağı title içinde bırakıyordu.
const QUALITY_FLAG = /^(?<loc>.*?)\s*(?<flag>İlksel|Otomatik|REVIZE\d*(?:\s*\([^)]*\))?)\s*$/;

/**
 * Yer adını kalite bayrağından ayırır.
 * "İlksel" (ilk yayın) varsayılan durumdur ve rev=null olarak taşınır; yalnızca REVIZE bilgisi saklanır.
 *
 * @param {String} lokasyon
 * @returns {{title: String, rev: String|null}}
 */
const parseLocation = (lokasyon) => {
	const trimmed = `${lokasyon}`.trim();
	const matched = QUALITY_FLAG.exec(trimmed);
	if (!matched) {
		return { title: trimmed, rev: null };
	}
	const { loc, flag } = matched.groups;
	return { title: loc.trim(), rev: flag.startsWith('REVIZE') ? flag.trim() : null };
};

module.exports.parseLocation = parseLocation;

// AFAD zaman zaman yüzeye çok yakın olayları negatif derinlikle bildiriyor (-0.014 km gibi).
// Kaydı tümden atmak veri kaybı olur; derinlik 0'a çekilir. Kandilli'de de aynı koruma uygulanır.
const normalizeDepth = (depth) => (Number.isNaN(depth) || depth >= 0 ? depth : 0);

// Kandilli bazı aylık arşivlerde saat ayracını nokta yazıyor: "2011.03.31 23.34.08".
// kk_date bunu parse edemiyor. 201103'ün TAMAMI (956 kayıt) bu yüzden okunamamıştı.
const normalizeDateString = (value) => `${value}`.trim().replace(/^(\d{4}[.-]\d{2}[.-]\d{2})[ T](\d{2})[.:](\d{2})[.:](\d{2})/, '$1 $2:$3:$4');

// Modeller earthquake_id ÜRETMEZ: ID, dedup'tan sonra yalnızca gerçekten yazılacak kayıtlara repositories.data.multiSave
// içinde verilir; benzersizliği unique index garanti eder (constants/indexes.js).
module.exports.kandilli_models = (data, limit = null) => {
	try {
		const model_data = [];
		let skipped = 0;
		let lastError = null;
		const data_length = data.length;
		for (let index = 0; index < data_length; index++) {
			if (limit && index + 1 > limit) {
				break;
			}
			// Kayıt başına koru: tek bozuk satır yüzünden tüm ay/feed kaybedilmemeli
			try {
				const { title, rev } = parseLocation(data[index]['@_lokasyon']);
				const when = normalizeDateString(data[index]['@_name']);
				model_data.push({
					provider: constants.providers.KANDILLI,
					title,
					mag: parseFloat(data[index]['@_mag']),
					depth: normalizeDepth(parseFloat(data[index]['@_Depth'])),
					geojson: {
						type: 'Point',
						coordinates: [parseFloat(data[index]['@_lng']), parseFloat(data[index]['@_lat'])],
					},
					rev,
					date_time: new helpers.date.kk_date(when).format('YYYY-MM-DD HH:mm:ss'),
					created_at: parseInt(new helpers.date.kk_date(when).format('X'), 10),
					location_tz: 'Europe/Istanbul',
				});
			} catch (error) {
				skipped += 1;
				lastError = error;
			}
		}
		// Sessiz kayıp olmasın: kaç satırın neden atlandığı loglanır
		if (skipped > 0) {
			console.warn(`kandilli_models -> ${skipped}/${data.length} kayıt ayrıştırılamadı, sonuncusu: ${lastError?.message}`);
		}
		return { data: model_data, metadata: { total: data.length } };
	} catch (error) {
		console.error(error);
		return { data: [], metadata: { total: 0 } };
	}
};

/**
 * Kayıtlara location_properties ekler ve boş kalan başlığı hesaplanan yer adından doldurur.
 *
 * Kaynaklar nadiren yer adı olmadan kayıt yayımlıyor (AFAD'da 6 örnek görüldü). Etiketi yok diye
 * gerçek bir depremi düşürmek veri kaybıdır; epiCenter/closestCity adı yeterli bir karşılıktır.
 *
 * @param {Array} records
 * @returns {Array}
 */
module.exports.enrich = (records) => {
	for (const record of records) {
		record.location_properties = earthquakes.location_properties(record.geojson.coordinates[0], record.geojson.coordinates[1]);
		if (!record.title || `${record.title}`.trim().length < 1 || record.title === '-') {
			record.title = record.location_properties.epiCenter?.name || record.location_properties.closestCity?.name || '';
		}
	}
	return records;
};

// Modeller earthquake_id ÜRETMEZ: ID, dedup'tan sonra yalnızca gerçekten yazılacak kayıtlara repositories.data.multiSave
// içinde verilir; benzersizliği unique index garanti eder (constants/indexes.js).
module.exports.afad_models = (data, limit = null) => {
	try {
		const model_data = [];
		const data_length = data.length;
		for (let index = 0; index < data_length; index++) {
			if (limit && index + 1 > limit) {
				break;
			}
			// location null gelirse .trim() tüm batch'i düşürürdü; boş başlığı enrich() doldurur
			data[index]['location'] = (data[index]['location'] || '').trim();
			data[index]['longitude'] = parseFloat(data[index]['longitude']);
			data[index]['latitude'] = parseFloat(data[index]['latitude']);
			model_data.push({
				provider: constants.providers.AFAD,
				title: data[index]['location'],
				mag: parseFloat(data[index]['magnitude']),
				depth: normalizeDepth(parseFloat(data[index]['depth'])),
				geojson: {
					type: 'Point',
					coordinates: [data[index]['longitude'], data[index]['latitude']],
				},
				rev: null,
				// AFAD 'date' alanı UTC ve saat dilimi eki taşımaz ('2026-11-08T22:26:43')
				date_time: new helpers.date.kk_date(data[index]['date']).add(3, 'hours').format('YYYY-MM-DD HH:mm:ss'),
				created_at: parseInt(new helpers.date.kk_date(data[index]['date']).add(3, 'hours').format('X'), 10),
				location_tz: 'Europe/Istanbul',
			});
		}
		return { data: model_data, metadata: { total: data.length } };
	} catch (error) {
		console.error(error);
		return { data: [], metadata: { total: 0 } };
	}
};
