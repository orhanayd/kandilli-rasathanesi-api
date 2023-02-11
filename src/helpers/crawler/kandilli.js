const axios = require('axios');
const { XMLParser } = require('fast-xml-parser');
const helpers_crawler = require('./helpers');
const helpers = require('../../helpers');
const db = require('../../db');

const alwaysArray = [
    'earhquake.eqlist'
];

module.exports.get = async (limit = null) => {
    const parser = new XMLParser({
        ignoreAttributes: false,
        ignoreDeclaration: true,
        ignorePiTags: true,
        attributeNamePrefix: '@_',
        isArray: (name, jpath) => {
            if (alwaysArray.indexOf(jpath) !== -1) return true;
        }
    });
    let response = await axios.get(process.env.KANDILLI_XML + '?v=' + helpers.date.moment.timestampMS());
    if (!response && response.data) {
        return false;
    }
    let data = parser.parse(response.data);
    if (!data.eqlist || !data.eqlist.earhquake) {
        return false;
    }
    if (!Array.isArray(data.eqlist.earhquake)) {
        console.error('Kandilli crawler is not Array!');
    }
    return helpers_crawler.kandilli_models(data.eqlist.earhquake.reverse(), limit);
};

module.exports.archive = async (date = helpers.date.moment.moment().format('Y-MM-DD'), limit = null) => {
    let query = await new db.MongoDB.CRUD('earthquake', 'data').find({ date_day: date }, [0, limit], {}, { _id: -1 });
    if (query === false) {
        throw new Error('kandilli archive find db error!');
    }
    return query;
};
