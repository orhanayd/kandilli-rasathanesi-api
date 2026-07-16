const helpers = require('../../helpers');
const repositories = require('../../repositories');
const constants = require('../../constants');
const cloudflare = require('../../helpers/cloudflare');
const db = require('../../db');

module.exports = async (_req, res) => {
	const responseBody = constants.response();
	responseBody.serverloadms = Date.now();

	try {
		const expiredBans = await repositories.ban.findExpired();
		for (const ban of expiredBans) {
			await repositories.ban.removeByIp(ban.ip);
		}

		responseBody.result = { cleaned: expiredBans.length, cf_sync: cloudflare.isEnabled() ? 'started' : 'disabled' };
	} catch (error) {
		helpers.errorLogger(error);
		responseBody.desc = error.message || '';
		responseBody.status = false;
		responseBody.httpStatus = 500;
	}

	responseBody.serverloadms = Date.now() - responseBody.serverloadms;
	res.status(responseBody.httpStatus).json(responseBody);

	if (cloudflare.isEnabled()) {
		try {
			const activeBans = await new db.MongoDB.CRUD('earthquake', 'bans').find({ expires_at: { $gt: new Date() } }, [0, 5000], { _id: false });
			const ips = activeBans.map((b) => b.ip);
			console.log(`ban-cleanup: syncing ${ips.length} ips to cloudflare`);
			const result = await cloudflare.replaceAll(ips);
			console.log(`ban-cleanup: cf sync done - success: ${result.success}, count: ${result.count || 0}`);
		} catch (err) {
			console.error(`ban-cleanup: cf sync error - ${err.message}`);
		}
	}
};
