module.exports.MongoDB = require('./MongoDB');
module.exports.nopeRedis = require('./nopeRedis');
// locations ~21MB geojson içerir; yalnızca ilk erişimde yüklenir (public API hiç kullanmaz,
// internal servis boot'ta earthquakes.warm() ile ısıtır)
Object.defineProperty(module.exports, 'locations', {
	get: () => require('./locations'),
	enumerable: true,
	configurable: true,
});
module.exports.populations = require('./populations');
