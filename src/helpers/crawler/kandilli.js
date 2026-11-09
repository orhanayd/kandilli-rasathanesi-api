const axios = require('axios');
const { XMLParser } = require('fast-xml-parser');
const helpers_crawler = require('./helpers');
const encoding = require('./encoding');
const helpers = require('../../helpers');
const constants = require('../../constants');

// Not: 'earhquake' Kandilli XML şemasının kendi etiket adıdır (kaynaktaki yazım hatası), düzeltilmemeli.
// jpath kökten yaprağa yazılır: eqlist > earhquake — tek depremli feed'de de dizi parse edilmesini sağlar.
const alwaysArray = ['eqlist.earhquake'];

const parser = new XMLParser({
	ignoreAttributes: false,
	ignoreDeclaration: true,
	ignorePiTags: true,
	attributeNamePrefix: '@_',
	isArray: (_name, jpath) => {
		if (alwaysArray.indexOf(jpath) !== -1) return true;
	},
});

/**
 * XML'i ISO-8859-9 olarak indirip parse eder ve deprem listesini döndürür.
 *
 * @param {String} url
 * @param {String} source hata mesajlarında kullanılacak kaynak adı
 * @returns {Promise<Array>}
 */
async function fetchAndParse(url, source) {
	// arraybuffer: axios charset bilgisi olmayan yanıtı UTF-8 sanıp Türkçe karakterleri bozmasın
	const response = await axios.get(url, { responseType: 'arraybuffer' });
	if (!response?.data) {
		throw new constants.errors.ServerError(source, 'Kandilli fetch error !');
	}
	const data = parser.parse(encoding.decodeLatin5(response.data));
	if (!data.eqlist?.earhquake) {
		throw new constants.errors.ServerError(source, 'Kandilli data error !');
	}
	if (!Array.isArray(data.eqlist.earhquake)) {
		throw new constants.errors.ServerError(source, 'Kandilli data is not array error !');
	}
	return data.eqlist.earhquake;
}

module.exports.get = async (limit = null) => {
	const list = await fetchAndParse(`${process.env.KANDILLI_XML}?v=${new helpers.date.kk_date().format('x')}`, 'helpers.crawler.get');
	return helpers_crawler.kandilli_models(list.reverse(), limit);
};

/**
 * Aylık arşiv XML'i. `date` YYYYMM formatındadır (ör. 202302) — YYYY-MM 404 döner.
 *
 * @param {String} date YYYYMM
 * @returns {Promise<{data: Array, metadata: {total: Number}}>}
 */
module.exports.getByDate = async (date) => {
	const list = await fetchAndParse(
		`${process.env.KANDILLI_DATE_XML}${date}.xml?v=${new helpers.date.kk_date().format('x')}`,
		'helpers.crawler.getByDate',
	);
	return helpers_crawler.kandilli_models(list.reverse());
};
