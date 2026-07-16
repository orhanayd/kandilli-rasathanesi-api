const axios = require('axios');
const { XMLParser } = require('fast-xml-parser');
const helpers_crawler = require('./helpers');
const helpers = require('../../helpers');
const constants = require('../../constants');

// Not: 'earhquake' Kandilli XML şemasının kendi etiket adıdır (kaynaktaki yazım hatası), düzeltilmemeli.
// jpath kökten yaprağa yazılır: eqlist > earhquake — tek depremli feed'de de dizi parse edilmesini sağlar.
const alwaysArray = ['eqlist.earhquake'];

module.exports.get = async (limit = null) => {
	const parser = new XMLParser({
		ignoreAttributes: false,
		ignoreDeclaration: true,
		ignorePiTags: true,
		attributeNamePrefix: '@_',
		isArray: (_name, jpath) => {
			if (alwaysArray.indexOf(jpath) !== -1) return true;
		},
	});
	const response = await axios.get(`${process.env.KANDILLI_XML}?v=${new helpers.date.kk_date().format('x')}`);
	if (!response || !response.data) {
		throw new constants.errors.ServerError('helpers.crawler.get', 'Kandilli fetch error !');
	}
	const data = parser.parse(response.data);
	if (!data.eqlist || !data.eqlist.earhquake) {
		throw new constants.errors.ServerError('helpers.crawler.get', 'Kandilli data error !');
	}
	if (!Array.isArray(data.eqlist.earhquake)) {
		throw new constants.errors.ServerError('helpers.crawler.get', 'Kandilli data is not array error !');
	}
	return helpers_crawler.kandilli_models(data.eqlist.earhquake.reverse(), limit);
};

module.exports.getByDate = async (date) => {
	const parser = new XMLParser({
		ignoreAttributes: false,
		ignoreDeclaration: true,
		ignorePiTags: true,
		attributeNamePrefix: '@_',
		isArray: (_name, jpath) => {
			if (alwaysArray.indexOf(jpath) !== -1) return true;
		},
	});
	const response = await axios.get(`${process.env.KANDILLI_DATE_XML}${date}.xml?v=${new helpers.date.kk_date().format('x')}`);
	if (!response || !response.data) {
		throw new constants.errors.ServerError('helpers.crawler.getByDate', 'Kandilli fetch error !');
	}
	const data = parser.parse(response.data);
	if (!data.eqlist || !data.eqlist.earhquake) {
		throw new constants.errors.ServerError('helpers.crawler.getByDate', 'Kandilli data error !');
	}
	if (!Array.isArray(data.eqlist.earhquake)) {
		throw new constants.errors.ServerError('helpers.crawler.getByDate', 'Kandilli data is not array error !');
	}
	return helpers_crawler.kandilli_models(data.eqlist.earhquake.reverse());
};
