const kk_date = require('kk-date');
kk_date.caching({ status: true });
kk_date.config({ timezone: 'Europe/Istanbul', locale: 'tr' });
module.exports.moment = require('./moment');
module.exports.kk_date = kk_date;
