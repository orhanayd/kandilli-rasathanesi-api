const axios = require('axios');
const { XMLParser } = require('fast-xml-parser');
const helpers_crawler = require('./helpers');
const helpers = require('../../helpers');
const db = require('../../db');

const alwaysArray = [
    'earhquake.eqlist'
];

module.exports.get = async (limit = null) => {
    const cacheKey = 'kandilli/raw';
    const parser = new XMLParser({
        ignoreAttributes: false,
        ignoreDeclaration: true,
        ignorePiTags: true,
        attributeNamePrefix: '@_',
        isArray: (name, jpath) => {
            if (alwaysArray.indexOf(jpath) !== -1) return true;
        }
    });
    let response = db.nopeRedis.getItem(cacheKey);
    if (!response) {
        response = await axios.get(process.env.KANDILLI_XML + '?v=' + helpers.date.moment.timestampMS());
        if (!response && response.data) {
            return false;
        }
        response = response.data;
        db.nopeRedis.setItem(cacheKey, response, 30);
    }
    let data = parser.parse(response);
    if (!data.eqlist || !data.eqlist.earhquake) {
        return false;
    }
    if (!Array.isArray(data.eqlist.earhquake)) {
        console.error('Kandilli crawler is not Array!');
    }
    return helpers_crawler.kandilli_models(data.eqlist.earhquake.reverse(), limit);
};