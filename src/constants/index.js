require('dotenv').config();

module.exports.CONFIG = {
    CRON_KEY: process.env.CRON_KEY
};

module.exports.STAGES = {
    DEV: 'DEV',
    PROD: 'PROD'
};