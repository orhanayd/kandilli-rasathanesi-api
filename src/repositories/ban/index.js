const db = require('../../db');
const constants = require('../../constants');

const CACHE_KEY_PREFIX = 'ban:';
const BANNED_TTL = 600; // 10 minutes
const NOT_BANNED_TTL = 300; // 5 minutes
const BAN_DURATION_DAYS = 3;

module.exports.createIndex = async () => {
	try {
		await new db.MongoDB.CRUD('earthquake', 'bans').createIndex({ expires_at: 1 }, { expireAfterSeconds: 0 });
		await new db.MongoDB.CRUD('earthquake', 'bans').createIndex({ ip: 1 });
	} catch (err) {
		console.error('ban.createIndex error:', err);
	}
};

module.exports.check = async (ip) => {
	if (constants.CONFIG.BYPASS_IPS.includes(ip)) {
		return false;
	}

	const cacheKey = `${CACHE_KEY_PREFIX}${ip}`;
	const cached = db.nopeRedis.getItem(cacheKey);

	if (cached !== undefined && cached !== null) {
		return cached;
	}

	const doc = await new db.MongoDB.CRUD('earthquake', 'bans').find({ ip }, [0, 1], { _id: false });
	const isBanned = doc.length > 0;

	db.nopeRedis.setItem(cacheKey, isBanned, isBanned ? BANNED_TTL : NOT_BANNED_TTL);

	return isBanned;
};

module.exports.save = async (ip) => {
	if (constants.CONFIG.BYPASS_IPS.includes(ip)) {
		return false;
	}

	const now = new Date();
	const expiresAt = new Date(now.getTime() + BAN_DURATION_DAYS * 24 * 60 * 60 * 1000);

	await new db.MongoDB.CRUD('earthquake', 'bans').update(
		{ ip: `${ip}` },
		{ $set: { ip: `${ip}`, reason: 'rate_limit_exceeded', banned_at: now, expires_at: expiresAt } },
		false,
		{ upsert: true },
	);

	const cacheKey = `${CACHE_KEY_PREFIX}${ip}`;
	db.nopeRedis.setItem(cacheKey, true, BANNED_TTL);

	return true;
};

module.exports.count = async () => {
	return await new db.MongoDB.CRUD('earthquake', 'bans').count({});
};
