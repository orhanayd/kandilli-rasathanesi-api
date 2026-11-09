/**
 * MongoDB index'lerini src/constants/indexes.js ile eşitler (mantık: src/helpers/indexChecker.js).
 * Servisler bunu her açılışta zaten yapar; bu araç elle çalıştırmak ve ÖNCE planı görmek içindir.
 *
 * Kullanım:
 *   npm run indexes -- --dry-run          # hiçbir şeyi değiştirmeden ne yapılacağını göster
 *   npm run indexes                       # uygula
 *   NODE_ENV=DEV npm run indexes          # dev_ veritabanlarında
 *
 * Çıkış kodu: hata varsa 1.
 */
const db = require('../src/db');
const helpers = require('../src/helpers');

(async () => {
	const dryRun = process.argv.includes('--dry-run');
	const connection = await db.MongoDB.connector();
	if (!connection) {
		console.error('MongoDB bağlantısı kurulamadı');
		process.exit(1);
	}
	const results = await helpers.indexChecker.runAll({ dryRun, log: console.log });
	console.log(helpers.indexChecker.summary(results, dryRun));
	for (const failure of results.failures) {
		console.error(`  !! ${failure}`);
	}
	process.exit(results.failures.length > 0 ? 1 : 0);
})().catch((error) => {
	console.error(error);
	process.exit(1);
});
