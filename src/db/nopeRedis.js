const nopeRedis = require('nope-redis');
nopeRedis.config({
	evictionPolicy: 'lfu',
	maxMemorySize: 3,
	isMemoryStatsEnabled: false,
	defaultTtl: 30,
});
module.exports = nopeRedis;
