/* eslint-disable no-inner-declarations */
const helpers = require('../../helpers');
const repositories = require('../../repositories');
const constants = require('../../constants');

let running = false;

module.exports = async (_req, res) => {
	const responseBody = constants.response();
	responseBody.serverloadms = new helpers.date.kk_date().format('x');

	try {
		async function kandilliImport() {
			try {
				const kandilli_data = await helpers.crawler.kandilli.get();
				await repositories.data.multiSave(kandilli_data.data);
			} catch (error) {
				console.error(error);
			}
		}
		async function afadImport() {
			try {
				const afad_data = await helpers.crawler.afad.get(
					new helpers.date.kk_date().add(-1, 'days').format('YYYY-MM-DD'),
					new helpers.date.kk_date().format('YYYY-MM-DD'),
				);
				await repositories.data.multiSave(afad_data.data);
			} catch (error) {
				console.error(error);
			}
		}
		async function start() {
			await kandilliImport();
			await afadImport();
		}
		if (running) {
			responseBody.desc = 'already running';
		} else {
			running = true;
			start().finally(() => {
				running = false;
			});
		}
	} catch (error) {
		console.error(error);
		responseBody.desc = error.message || '';
		responseBody.status = false;
		responseBody.httpStatus = 500;
	}
	responseBody.serverloadms = new helpers.date.kk_date().format('x') - responseBody.serverloadms;
	return res.status(responseBody.httpStatus).json(responseBody);
};
