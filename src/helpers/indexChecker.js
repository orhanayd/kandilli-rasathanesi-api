const constants = require('../constants');
const db = require('../db');

/**
 * MongoDB index senkronizasyonu — tanımlar `constants.indexes` (TEK KAYNAK, açıklamalar orada).
 *
 * Tüketiciler:
 *   1) index.js / index-internal.js boot akışı → runAll() (her açılışta, engellemeden)
 *   2) tools/indexes.js → `npm run indexes` (elle; `--dry-run` hiçbir şeyi değiştirmeden planı gösterir)
 *
 * Tanımı olan her koleksiyonda:
 *   ++ eksik index oluşturulur (koleksiyon yoksa createIndex onu yaratır — unique index ilk kayıttan önce kurulur)
 *   ~~ aynı ad, farklı seçenek: unique false→true ve TTL süresi YERİNDE çevrilir (collMod) — index'siz pencere
 *      açılmaz (1M kayıtta /data/get tam taramaya düşerdi). Key sırası, sparse, partial, unique true→false gibi
 *      çevrilemeyen farklarda index düşürülüp yeniden oluşturulur.
 *   >> aynı key'ler tanımda olmayan başka bir adla varsa (ad değişikliği): eskisi düşer, yenisi aynı çalıştırmada kurulur
 *   -- listede olmayan index DÜŞÜRÜLÜR (_id_ hariç). Silmeler, oluşturma/dönüşümlerden SONRA yapılır.
 * Tanımı olmayan koleksiyona dokunulmaz.
 *
 * Hatalar akışı KESMEZ (kalan index'ler ve koleksiyonlar işlenir), `failures`'a yazılır. İki servis aynı anda
 * açılabilir: createIndex ve collMod idempotenttir, diğerinin düşürdüğü index için gelen IndexNotFound beklenen bir
 * yarıştır ve yok sayılır. Çakışan kayıt varken unique dönüşümü MongoDB reddeder (CannotConvertIndexToUnique);
 * bu bir failure olarak raporlanır, mevcut index olduğu gibi kalır.
 */

// karşılaştırılan seçenekler; geri kalanlar (v, ns, background) sürücü/sunucu ayrıntısıdır
const OPTION_KEYS = ['unique', 'expireAfterSeconds', 'sparse', 'partialFilterExpression'];
const BOOLEAN_OPTIONS = new Set(['unique', 'sparse']);

const emptyResults = () => ({ checked: 0, created: 0, converted: 0, recreated: 0, dropped: 0, failures: [] });

const normalize = (definition) =>
	definition.keys ? { keys: definition.keys, options: definition.options || {} } : { keys: definition, options: {} };

// sıra-duyarlı: compound index'te alan sırası anlamlıdır
const sameKeys = (a, b) => JSON.stringify(a) === JSON.stringify(b);

const optionValue = (source, key) => (BOOLEAN_OPTIONS.has(key) ? source[key] === true : source[key]);

const differingOptions = (existing, options) =>
	OPTION_KEYS.filter((key) => JSON.stringify(optionValue(existing, key)) !== JSON.stringify(optionValue(options, key)));

/**
 * Seçenek farkı yerinde (collMod) çevrilebilir mi? Çevrilebilirse uygulanacak collMod adımlarını döner, yoksa null.
 */
const inPlaceSteps = (name, existing, options, diffs) => {
	const steps = [];
	for (const key of diffs) {
		if (key === 'unique' && options.unique === true) {
			// prepareUnique önce yeni çakışan yazımları reddeder, sonra unique mevcut kayıtları doğrulayıp çevirir
			steps.push({ name, prepareUnique: true }, { name, unique: true });
		} else if (key === 'expireAfterSeconds' && typeof existing.expireAfterSeconds === 'number' && typeof options.expireAfterSeconds === 'number') {
			steps.push({ name, expireAfterSeconds: options.expireAfterSeconds });
		} else {
			return null;
		}
	}
	return steps;
};

const describe = (keys, options) => {
	const extra = OPTION_KEYS.filter((key) => options[key] !== undefined).map((key) => `${key}=${JSON.stringify(options[key])}`);
	return `${JSON.stringify(keys)}${extra.length ? ` ${extra.join(' ')}` : ''}`;
};

/**
 * Tek koleksiyonu tanımla eşitler.
 *
 * @returns {Promise<ReturnType<typeof emptyResults>>}
 */
async function syncCollection({ dbName, collectionName, definitions, dryRun, log }) {
	const results = emptyResults();
	const crud = new db.MongoDB.CRUD(dbName, collectionName);
	const label = `${crud.db}.${collectionName}`;
	const prefix = dryRun ? '[dry-run] ' : '';
	const fail = (indexName, message) => {
		log(`  !! ${label}.${indexName}: ${message}`);
		results.failures.push(`${label}.${indexName}: ${message}`);
	};
	// eşzamanlı diğer servis düşürmüş olabilir: IndexNotFound başarı sayılır
	const drop = async (indexName) => {
		if (dryRun) return true;
		try {
			await crud.dropIndex(indexName);
			return true;
		} catch (error) {
			if (error.codeName === 'IndexNotFound') return true;
			fail(indexName, `düşürülemedi (${error.message})`);
			return false;
		}
	};
	const create = async (indexName, keys, options) => {
		if (dryRun) return true;
		try {
			await crud.createIndex(keys, { ...options, name: indexName });
			return true;
		} catch (error) {
			fail(indexName, `oluşturulamadı (${error.codeName || ''} ${error.message})`);
			return false;
		}
	};

	let current;
	try {
		current = await crud.indexList();
	} catch (error) {
		fail('*', `index listesi okunamadı (${error.message})`);
		return results;
	}
	const handled = new Set(['_id_']);

	for (const [indexName, definition] of Object.entries(definitions)) {
		results.checked++;
		handled.add(indexName);
		const { keys, options } = normalize(definition);
		const existing = current.find((index) => index.name === indexName);

		if (!existing) {
			// ad değişikliği: aynı key'ler tanımda olmayan bir adla duruyorsa createIndex çakışır — önce eskisini düşür
			const renamed = current.find((index) => !definitions[index.name] && index.name !== '_id_' && sameKeys(index.key, keys));
			if (renamed) {
				log(`  ${prefix}>> ${label}: ${renamed.name} → ${indexName} (aynı key'ler, ad değişiyor)`);
				handled.add(renamed.name);
				if (!(await drop(renamed.name))) continue;
				results.dropped++;
			}
			log(`  ${prefix}++ ${label}.${indexName} ${describe(keys, options)}`);
			if (await create(indexName, keys, options)) results.created++;
			continue;
		}

		const diffs = sameKeys(existing.key, keys) ? differingOptions(existing, options) : ['key'];
		if (diffs.length === 0) continue;

		const steps = diffs.includes('key') ? null : inPlaceSteps(indexName, existing, options, diffs);
		if (steps) {
			log(`  ${prefix}~~ ${label}.${indexName}: ${diffs.join(', ')} yerinde çevriliyor → ${describe(keys, options)}`);
			if (dryRun) {
				results.converted++;
				continue;
			}
			try {
				const started = Date.now();
				for (const step of steps) {
					await crud.collModIndex(step);
				}
				results.converted++;
				log(`     ${label}.${indexName}: çevrildi (${Date.now() - started} ms)`);
			} catch (error) {
				fail(indexName, `yerinde çevrilemedi (${error.codeName || ''} ${error.message}) — mevcut index olduğu gibi kaldı`);
			}
			continue;
		}

		log(`  ${prefix}~~ ${label}.${indexName}: ${diffs.join(', ')} farklı, düşürülüp yeniden oluşturuluyor → ${describe(keys, options)}`);
		if (!(await drop(indexName))) continue;
		if (await create(indexName, keys, options)) {
			results.recreated++;
		} else {
			fail(indexName, 'eski tanım düşürüldü ama yeniden oluşturulamadı — index YOK');
		}
	}

	// listede olmayanlar: oluşturma/dönüşümlerden SONRA — yerine geçen index her zaman önce hazırdır
	for (const index of current) {
		if (handled.has(index.name)) continue;
		log(`  ${prefix}-- ${label}.${index.name} ${describe(index.key, index)} (tanımda yok)`);
		if (await drop(index.name)) results.dropped++;
	}

	return results;
}

const sum = (target, part) => {
	for (const key of ['checked', 'created', 'converted', 'recreated', 'dropped']) target[key] += part[key];
	target.failures.push(...part.failures);
	return target;
};

/**
 * `constants.indexes` içindeki tüm veritabanı/koleksiyonları eşitler. Bir koleksiyonun hatası diğerlerini durdurmaz.
 *
 * @param {{dryRun?: Boolean, log?: Function}} options
 * @returns {Promise<{checked: Number, created: Number, converted: Number, recreated: Number, dropped: Number, failures: String[]}>}
 */
module.exports.runAll = async ({ dryRun = false, log = console.log } = {}) => {
	const results = emptyResults();
	for (const [dbName, collections] of Object.entries(constants.indexes)) {
		for (const [collectionName, definitions] of Object.entries(collections)) {
			try {
				sum(results, await syncCollection({ dbName, collectionName, definitions, dryRun, log }));
			} catch (error) {
				results.failures.push(`${dbName}.${collectionName}: ${error.message}`);
				log(`  !! ${dbName}.${collectionName}: ${error.message}`);
			}
		}
	}
	return results;
};

/**
 * Tek satırlık özet (boot logu ve tools/indexes.js için)
 *
 * @param {Awaited<ReturnType<typeof module.exports.runAll>>} results
 * @param {Boolean} dryRun
 */
module.exports.summary = (results, dryRun = false) =>
	`indexes -> ${dryRun ? '[dry-run] ' : ''}${results.checked} tanım kontrol edildi: ${results.created} oluşturulan, ${results.converted} yerinde çevrilen, ` +
	`${results.recreated} yeniden oluşturulan, ${results.dropped} düşürülen, ${results.failures.length} hata`;
