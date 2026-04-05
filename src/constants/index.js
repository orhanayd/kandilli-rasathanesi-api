require('dotenv').config();

module.exports.CONFIG = {
	CRON_KEY: process.env.CRON_KEY,
	STATS_KEY: process.env.STATS_KEY,
	BYPASS_IPS: process.env.BYPASS_IPS.split(','),
	REQUEST_TIMEOUT_MS: parseInt(process.env.REQUEST_TIMEOUT_MS, 10) || 30000,
	CLOUDFLARE_ACCOUNT_ID: process.env.CLOUDFLARE_ACCOUNT_ID || '',
	CLOUDFLARE_API_KEY: process.env.CLOUDFLARE_API_KEY || '',
	CLOUDFLARE_EMAIL: process.env.CLOUDFLARE_EMAIL || '',
	CLOUDFLARE_LIST_ID: process.env.CLOUDFLARE_LIST_ID || '',
};

module.exports.STAGES = {
	DEV: 'DEV',
	PROD: 'PROD',
};

module.exports.stats = {
	dateBy: 'dateBy',
	hourBy: 'hourBy',
	epiCenterBy: 'epiCenterBy',
	airportsBy: 'airportsBy',
	magBy: 'magBy',
	dateByEarthQuakes: 'dateByEarthQuakes',
};

module.exports.statsRange = {
	TODAY: 'TODAY',
	YESTERDAY: 'YESTERDAY',
	LAST3DAYS: 'LAST3DAYS',
	LAST5DAYS: 'LAST5DAYS',
	LAST7DAYS: 'LAST7DAYS',
	THISMONTH: 'THISMONTH',
	LASTMONTH: 'LASTMONTH',
	LAST2MONTHS: 'LAST2MONTHS',
	LAST3MONTHS: 'LAST3MONTHS',
	DATE: 'DATE',
};

module.exports.providers = {
	KANDILLI: 'kandilli',
	AFAD: 'afad',
};

module.exports.providersList = Object.values(this.providers);

module.exports.response = () => {
	return {
		status: true,
		httpStatus: 200,
		desc: '',
	};
};

module.exports.errors = require('./errors');
