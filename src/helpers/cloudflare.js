const axios = require('axios');
const constants = require('../constants');

const CF_TIMEOUT = 10000;
const LIST_NAME = 'kandilli_ban_list';

let listId = constants.CONFIG.CLOUDFLARE_LIST_ID;
let initialized = false;

const isConfigured = () => {
	const { CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_API_KEY, CLOUDFLARE_EMAIL } = constants.CONFIG;
	return !!(CLOUDFLARE_ACCOUNT_ID && CLOUDFLARE_API_KEY && CLOUDFLARE_EMAIL);
};

const getHeaders = () => ({
	'X-Auth-Email': constants.CONFIG.CLOUDFLARE_EMAIL,
	'X-Auth-Key': constants.CONFIG.CLOUDFLARE_API_KEY,
	'Content-Type': 'application/json',
});

const getBaseUrl = () => `https://api.cloudflare.com/client/v4/accounts/${constants.CONFIG.CLOUDFLARE_ACCOUNT_ID}/rules/lists`;

const init = async () => {
	if (initialized) return !!listId;
	initialized = true;

	if (!isConfigured()) return false;

	if (listId) return true;

	try {
		const response = await axios.get(getBaseUrl(), { headers: getHeaders(), timeout: CF_TIMEOUT });

		if (response.data?.success && response.data.result) {
			const existing = response.data.result.find((list) => list.name === LIST_NAME);
			if (existing) {
				listId = existing.id;
				console.log(`Cloudflare list found: ${LIST_NAME} - CLOUDFLARE_LIST_ID=${listId}`);
				return true;
			}
		}

		const createResponse = await axios.post(
			getBaseUrl(),
			{ name: LIST_NAME, kind: 'ip', description: 'Kandilli API ban list' },
			{ headers: getHeaders(), timeout: CF_TIMEOUT },
		);

		if (createResponse.data?.success && createResponse.data.result?.id) {
			listId = createResponse.data.result.id;
			console.log(`Cloudflare list created: ${LIST_NAME} - CLOUDFLARE_LIST_ID=${listId}`);
			return true;
		}

		return false;
	} catch (err) {
		const status = err.response?.status || 'no response';
		const msg = err.response?.data?.errors?.[0]?.message || err.message || '';
		console.error(`cloudflare init failed - status: ${status} - ${msg}`);
		initialized = false;
		return false;
	}
};

module.exports.isEnabled = () => isConfigured() && !!listId;

module.exports.addIp = async (ip) => {
	try {
		if (!(await init()) || !listId) return { success: false };

		await axios.post(`${getBaseUrl()}/${listId}/items`, [{ ip }], { headers: getHeaders(), timeout: CF_TIMEOUT });

		return { success: true };
	} catch (_err) {
		console.error('cloudflare add ip failed');
		return { success: false };
	}
};

module.exports.addIps = async (ips) => {
	try {
		if (!(await init()) || !listId || !ips.length) return { success: false, count: 0 };

		const uniqueIps = [...new Set(ips)];
		const body = uniqueIps.map((ip) => ({ ip }));
		const resp = await axios.post(`${getBaseUrl()}/${listId}/items`, body, { headers: getHeaders(), timeout: 30000 });

		if (!resp.data?.success) {
			const msg = resp.data?.errors?.[0]?.message || 'unknown';
			console.error(`cloudflare bulk add rejected - ${msg}`);
			return { success: false, count: 0 };
		}

		return { success: true, count: ips.length };
	} catch (err) {
		const status = err.response?.status || 'no response';
		const msg = err.response?.data?.errors?.[0]?.message || err.message || '';
		console.error(`cloudflare bulk add failed - status: ${status} - ${msg}`);
		return { success: false, count: 0 };
	}
};

module.exports.removeIp = async (ip) => {
	try {
		if (!(await init()) || !listId) return { success: false };

		const itemsResult = await module.exports.listItems();
		if (!itemsResult.success) return { success: false };

		const item = itemsResult.items.find((i) => i.ip === ip);
		if (!item) return { success: true };

		await axios.delete(`${getBaseUrl()}/${listId}/items`, {
			headers: getHeaders(),
			timeout: CF_TIMEOUT,
			data: { items: [{ id: item.id }] },
		});

		return { success: true };
	} catch (_err) {
		console.error('cloudflare remove ip failed');
		return { success: false };
	}
};

module.exports.removeIps = async (itemIds) => {
	try {
		if (!(await init()) || !listId || !itemIds.length) return { success: false, count: 0 };

		const body = { items: itemIds.map((id) => ({ id })) };
		await axios.delete(`${getBaseUrl()}/${listId}/items`, { headers: getHeaders(), timeout: 30000, data: body });

		return { success: true, count: itemIds.length };
	} catch (_err) {
		console.error('cloudflare bulk remove failed');
		return { success: false, count: 0 };
	}
};

module.exports.replaceAll = async (ips) => {
	try {
		if (!(await init()) || !listId) return { success: false };

		const currentItems = await module.exports.listItems();
		if (currentItems.success && currentItems.items.length > 0) {
			const ids = currentItems.items.map((i) => i.id);
			await module.exports.removeIps(ids);
		}

		if (ips.length > 0) {
			await module.exports.addIps(ips);
		}

		return { success: true, count: ips.length };
	} catch (_err) {
		console.error('cloudflare replace all failed');
		return { success: false };
	}
};

module.exports.listItems = async () => {
	try {
		if (!(await init()) || !listId) return { success: false, items: [] };

		const items = [];
		let cursor;

		do {
			const params = cursor ? { cursor } : {};
			const response = await axios.get(`${getBaseUrl()}/${listId}/items`, {
				headers: getHeaders(),
				timeout: CF_TIMEOUT,
				params,
			});

			if (!response.data?.success) break;

			if (response.data.result) {
				items.push(...response.data.result);
			}

			cursor = response.data.result_info?.cursors?.after;
		} while (cursor);

		return { success: true, items };
	} catch (_err) {
		console.error('cloudflare list items failed');
		return { success: false, items: [] };
	}
};

module.exports.init = init;
