const nopeRedis = require('nope-redis');
nopeRedis.config({
	evictionPolicy: 'lfu',
	maxMemorySize: 16,
	isMemoryStatsEnabled: false,
	defaultTtl: 30,
});
module.exports = nopeRedis;
