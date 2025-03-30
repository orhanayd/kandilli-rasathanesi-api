const axios = require('axios');
const { XMLParser } = require('fast-xml-parser');
const helpers_crawler = require('./helpers');
const helpers = require('../../helpers');

const alwaysArray = ['earhquake.eqlist'];

module.exports.get = async (limit = null) => {
	const parser = new XMLParser({
		ignoreAttributes: false,
		ignoreDeclaration: true,
		ignorePiTags: true,
		attributeNamePrefix: '@_',
		isArray: (name, jpath) => {
			if (alwaysArray.indexOf(jpath) !== -1) return true;
		},
	});
	let response = await axios.get(`${process.env.KANDILLI_XML}?v=${helpers.date.moment.timestampMS()}`);
	if (!response || !response.data) {
		throw new Error('Kandilli axios error !');
	}
	response = response.data;
	const data = parser.parse(response);
	if (!data.eqlist || !data.eqlist.earhquake) {
		throw new Error('Kandilli data error !');
	}
	if (!Array.isArray(data.eqlist.earhquake)) {
		throw new Error('Kandilli crawler is not Array !');
	}
	return helpers_crawler.kandilli_models(data.eqlist.earhquake.reverse(), limit);
};
