const db = require('../../db');
const helpers_crawler = require('../../helpers/crawler/helpers');

module.exports.stats = require('./stats');

const dedupKey = (item) =>
	`${item.provider}|${item.date_time}|${item.mag}|${item.depth}|${item.geojson.coordinates[0]}|${item.geojson.coordinates[1]}`;

/**
 * Kaydedilebilir kayıt mı? Kaynak API'ler zaman zaman bozuk satır döndürüyor
 * ([0,0] koordinat, NaN büyüklük/derinlik) — bunlar DB'ye girmemeli.
 * Boş başlık burada elenmez: deprem gerçektir, yalnızca etiketi eksiktir; `enrich()` onu
 * hesaplanan epiCenter/closestCity adından doldurur.
 *
 * @param {Object} item
 * @returns {Boolean}
 */
const isValidRecord = (item) => {
	if (Number.isNaN(item.mag) || typeof item.mag !== 'number') return false;
	if (Number.isNaN(item.depth) || typeof item.depth !== 'number') return false;
	const coordinates = item.geojson?.coordinates;
	if (!Array.isArray(coordinates) || coordinates.length < 2) return false;
	const [lng, lat] = coordinates;
	if (typeof lng !== 'number' || typeof lat !== 'number' || Number.isNaN(lng) || Number.isNaN(lat)) return false;
	if (lng === 0 && lat === 0) return false;
	if (lng < -180 || lng > 180 || lat < -90 || lat > 90) return false;
	return true;
};

module.exports.isValidRecord = isValidRecord;

/**
 * Bir sağlayıcının DB'deki en yeni kaydının zamanı — ingestion penceresini buna göre genişletir.
 *
 * @param {String} provider
 * @returns {Promise<String|null>} "YYYY-MM-DD HH:mm:ss" veya kayıt yoksa null
 */
module.exports.latestDateTime = async (provider) => {
	const query = await new db.MongoDB.CRUD('earthquake', 'data_v2').find({ provider }, [0, 1], { _id: false, date_time: true }, { date_time: -1 });
	return query.length > 0 ? query[0].date_time : null;
};

// earthquake_id çakışırsa yeni ID ile en fazla bu kadar yeniden denenir (63^13 uzayda çakışma pratikte hiç olmaz)
const MAX_ID_RETRIES = 3;

// yalnızca earthquake_id unique index'inden gelen E11000 (başka bir unique ihlali yeni ID ile düzelmez)
const isDuplicateIdError = (writeError) => writeError?.code === 11000 && /index: earthquake_id_1 /.test(writeError.errmsg || '');

/**
 * Kayıtları benzersiz earthquake_id ile yazar. ID burada — dedup'tan SONRA, yalnızca yazılacak kayıtlara — verilir;
 * benzersizliği unique index garanti eder. Ön sorguyla kontrol (üret → var mı bak → yaz) yarış penceresi bırakır,
 * batch içi çakışmayı görmez ve dedup'ta atılacak kayıtlar için de sorgu harcardı.
 * ordered:false — bir kayıt hata verse de diğerleri yazılır; yalnızca ID çakışmasıyla düşenler yeni ID ile yeniden
 * denenir. Başka türde yazım hatası varsa önce ID çakışanlar kurtarılır, sonra hata yukarı fırlatılır.
 *
 * @param {Object} crud db.MongoDB.CRUD
 * @param {Array<Object>} records earthquake_id taşımayan kayıtlar
 */
const insertWithUniqueIds = async (crud, records) => {
	// earthquake_id ilk alan olsun (API yanıtlarındaki alan sırası korunur); kayıtta ID varsa yok sayılır — tek sahibi burası
	const withId = ({ earthquake_id: _ignored, ...record }) => ({ earthquake_id: db.MongoDB.id(), ...record });
	let pending = records.map(withId);
	let deferredError = null;
	for (let attempt = 0; pending.length > 0; attempt++) {
		try {
			await crud.insertMany(pending, { ordered: false });
			break;
		} catch (error) {
			const writeErrors = Array.isArray(error?.writeErrors) ? error.writeErrors : [];
			if (writeErrors.length === 0) {
				throw error; // bağlantı vb.: kayıt bazlı yazım hatası değil
			}
			const duplicates = writeErrors.filter(isDuplicateIdError);
			if (duplicates.length < writeErrors.length) {
				deferredError = error;
			}
			if (duplicates.length === 0) {
				break;
			}
			if (attempt >= MAX_ID_RETRIES) {
				deferredError = error;
				break;
			}
			console.warn(`multiSave -> ${duplicates.length} kayıtta earthquake_id çakıştı, yeni ID ile yeniden deneniyor (deneme ${attempt + 1})`);
			pending = duplicates.map((writeError) => withId(pending[writeError.index]));
		}
	}
	if (deferredError) {
		throw deferredError;
	}
};

module.exports.multiSave = async (data, collection = 'data_v2') => {
	const candidates = data.filter(isValidRecord);
	if (candidates.length < data.length) {
		console.warn(`multiSave -> ${data.length - candidates.length} geçersiz kayıt atlandı`);
	}
	if (candidates.length < 1) {
		return true;
	}
	let minDate = candidates[0].date_time;
	let maxDate = candidates[0].date_time;
	const providers = new Set();
	for (const item of candidates) {
		if (item.date_time < minDate) minDate = item.date_time;
		if (item.date_time > maxDate) maxDate = item.date_time;
		providers.add(item.provider);
	}
	const existing = await new db.MongoDB.CRUD('earthquake', collection).find(
		{ date_time: { $gte: minDate, $lte: maxDate }, provider: { $in: [...providers] } },
		[0, 0],
		{ _id: false, provider: true, date_time: true, mag: true, depth: true, 'geojson.coordinates': true },
	);
	const seen = new Set(existing.map(dedupKey));
	const mustInsert = [];
	for (const item of candidates) {
		const key = dedupKey(item);
		if (!seen.has(key)) {
			seen.add(key);
			mustInsert.push(item);
		}
	}
	if (mustInsert.length < 1) {
		return true;
	}
	helpers_crawler.enrich(mustInsert);
	await insertWithUniqueIds(new db.MongoDB.CRUD('earthquake', collection), mustInsert);
	return true;
};

module.exports.search = async (match = null, geoNear = null, sort = null, skip = null, limit = null, project = null) => {
	const agg = [];
	agg.push({ $match: geoNear ? { ...match, ...geoNear } : match });

	if (sort) {
		agg.push({ $sort: sort });
	}
	if (skip && skip > 0) {
		agg.push({ $skip: Number(skip) });
	}
	if (limit && limit > 0) {
		agg.push({ $limit: Number(limit) });
	}
	agg.push({ $project: { ...project, _id: false } });
	const query = await new db.MongoDB.CRUD('earthquake', 'data_v2').aggregate(agg);
	if (query.length > 0) {
		return query;
	}
	return [];
};

module.exports.sitemap = async (skip, limit) => {
	const agg = [
		{ $sort: { date_time: -1 } },
		{ $skip: Number(skip) },
		{ $limit: Number(limit) },
		{ $project: { _id: false, earthquake_id: 1, title: 1, date_time: 1, mag: 1, 'location_properties.epiCenter': 1 } },
	];
	const query = await new db.MongoDB.CRUD('earthquake', 'data_v2').aggregate(agg);
	return query.length > 0 ? query : [];
};

module.exports.sitemapCount = async () => {
	return await new db.MongoDB.CRUD('earthquake', 'data_v2').estimatedCount();
};

module.exports.get = async (earthquake_id, project = { _id: false }) => {
	try {
		const query = await new db.MongoDB.CRUD('earthquake', 'data_v2').find({ earthquake_id }, [0, 1], project);
		if (query.length > 0) {
			return query[0];
		}
		return null;
	} catch (error) {
		console.error(error);
		return false;
	}
};
