const db = require('../../db');
const helpers = require('../../helpers');
const constants = require('../../constants');
const ban = require('../ban');

module.exports.createIndex = async () => {
	try {
		await new db.MongoDB.CRUD('earthquake', 'requests').createIndex({ expires_at: 1 }, { expireAfterSeconds: 0 });
		await new db.MongoDB.CRUD('earthquake', 'requests').createIndex({ ip: 1, created_at: 1 });
	} catch (err) {
		console.error('rate.createIndex error:', err);
	}
};

module.exports.check = async (ip) => {
	if (constants.CONFIG.BYPASS_IPS.includes(ip)) {
		return true;
	}
	const count = await this.count(ip);
	if (count >= 40) {
		await ban.save(ip);
		throw new constants.errors.TooManyRequest(
			'repositories.rate.check',
			'Too Many Request in 1 minute! Requests limited in 1 minute maximum 40 times. Your IP has been banned for 3 days.',
		);
	}
	this.save(ip);
	return true;
};

module.exports.count = async (ip) => {
	return await new db.MongoDB.CRUD('earthquake', 'requests').count({
		ip: `${ip}`,
		created_at: { $gte: new helpers.date.kk_date().add(-1, 'minutes').format('X') },
	});
};

module.exports.save = async (ip) => {
	await new db.MongoDB.CRUD('earthquake', 'requests').insert({
		ip: `${ip}`,
		created_at: new helpers.date.kk_date().format('X'),
		expires_at: new Date(Date.now() + 60 * 1000),
	});
	return true;
};


module.exports.stats = async () => {
	const result = {
		total_request_ip: 0,
		total_request: 0,
	};
	const data = await new db.MongoDB.CRUD('earthquake', 'requests').aggregate([
		{
			$group: {
				_id: '$ip',
				total: {
					$sum: 1,
				},
			},
		},
		{
			$group: {
				_id: null,
				total_ip: {
					$sum: 1,
				},
				total: {
					$sum: '$total',
				},
			},
		},
	]);
	if (data.length > 0) {
		result.total_request_ip = data[0].total_ip;
		result.total_request = data[0].total;
	}
	return result;
};
