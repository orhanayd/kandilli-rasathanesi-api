require('dotenv').config();

module.exports.CONFIG = {
    CRON_KEY: process.env.CRON_KEY,
    STATS_KEY: process.env.STATS_KEY,
};

module.exports.STAGES = {
    DEV: 'DEV',
    PROD: 'PROD'
};

module.exports.stats = {
    dateBy: 'dateBy',
    hourBy: 'hourBy',
    epiCenterBy: 'epiCenterBy',
    airportsBy: 'airportsBy',
    magBy: 'magBy',
    dateByEarthQuakes: 'dateByEarthQuakes'
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
    LAST3MONTHS: 'LAST3MONTHS'
};

module.exports.providers = {
    KANDILLI: 'kandilli',
    AFAD: 'afad'
};