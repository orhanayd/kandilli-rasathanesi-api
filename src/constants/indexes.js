/**
 * MongoDB index tanımları — TEK KAYNAK. Senkronizasyon: helpers/indexChecker.js
 *
 * Tüketiciler:
 *   1) index.js ve index-internal.js boot akışı → helpers.indexChecker.runAll() (her açılışta, engellemeden)
 *   2) tools/indexes.js → `npm run indexes` (elle; `-- --dry-run` yalnızca planı gösterir)
 *
 * Yapı: { veritabanı: { koleksiyon: { indexAdı: tanım } } }. NODE_ENV=DEV iken veritabanı adına dev_ öneki eklenir.
 * Tanım iki şekilde yazılabilir:
 *   düz keySpec:  { date_time: 1 }
 *   options'lı:   { keys: { earthquake_id: 1 }, options: { unique: true } }
 * index adı MongoDB'nin varsayılan adlandırmasıyla aynı tutulur ({ ip: 1, created_at: -1 } → 'ip_1_created_at_-1').
 *
 * DAVRANIŞ — tanımı olan koleksiyonda listede OLMAYAN index SİLİNİR (_id_ hariç). Yeni bir sorgu için index
 * gerekiyorsa buraya eklenmeli; elle (mongosh) açılan index bir sonraki açılışta düşer. Tanımı olmayan koleksiyona
 * (ör. data_v2_days) dokunulmaz.
 *
 * Kullanım sayıları prod $indexStats'tan (2026-11-09, sunucu 13 gündür açık).
 */

module.exports.earthquake = {
	data_v2: {
		// multiSave dedup'ı: tek aralık sorgusu + 6 alanlı anahtar (provider+date_time+mag+depth+koordinat) — ~485k ops
		dedup_key: {
			keys: { provider: 1, date_time: 1, mag: 1, depth: 1, 'geojson.coordinates.0': 1, 'geojson.coordinates.1': 1 },
		},
		// canlı/arşiv/kombine listeler: date_time aralığı + sıralama (tek alanlı index iki yönde de taranır) — ~140k ops
		date_time_1: { date_time: 1 },
		// /data/get ve sitemap; unique: earthquake_id benzersizliğinin garantisi (multiSave çakışmada yeni ID ile yeniden dener) — ~1.6M ops
		earthquake_id_1: { keys: { earthquake_id: 1 }, options: { unique: true } },
		// /data/search cityCode filtresi ve /data/stats epiCenter dağılımları — ~1.4k ops
		'location_properties.epiCenter.cityCode_1': { 'location_properties.epiCenter.cityCode': 1 },
	},
	requests: {
		// TTL: her istek kaydı expires_at'te (kayıttan 60 sn sonra) MongoDB tarafından silinir — rate temizliği yalnızca bu
		expires_at_1: { keys: { expires_at: 1 }, options: { expireAfterSeconds: 0 } },
		// rate limit sayımı: IP başına son 1 dakika — ~6.1M ops
		'ip_1_created_at_-1': { ip: 1, created_at: -1 },
	},
	bans: {
		// TTL: ban süresi (3 gün) dolunca kayıt silinir
		expires_at_1: { keys: { expires_at: 1 }, options: { expireAfterSeconds: 0 } },
		// ban kontrolü (her istekte, önbellek kaçarsa) ve upsert — ~1.85M ops
		ip_1: { ip: 1 },
	},
};
