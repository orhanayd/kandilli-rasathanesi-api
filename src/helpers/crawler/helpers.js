const helpers = require('../../helpers');
const db = require('../../db');
const helpers_crawler = require('../index');

module.exports.kandilli_models = (data, limit = null) => {
    try {
        let model_data = [];
        for (let index = 0; index < data.length; index++) {
            if (limit && index + 1 > limit) {
                break;
            }
            let rev = null;
            const splitted = data[index]['@_lokasyon'].split(')');
            if (splitted && splitted.length > 2) {
                data[index]['@_lokasyon'] = splitted[0] + ')';
                rev = (splitted[1] + ')').trim();
            }
            data[index]['@_lng'] = parseFloat(data[index]['@_lng']);
            data[index]['@_lat'] = parseFloat(data[index]['@_lat']);
            model_data.push(
                {
                    earthquake_id: db.MongoDB.id(),
                    provider: 'kandilli',
                    title: data[index]['@_lokasyon'],
                    date: data[index]['@_name'],
                    mag: parseFloat(data[index]['@_mag']),
                    depth: parseFloat(data[index]['@_Depth']),
                    geojson: {
                        'type': 'Point',
                        'coordinates': [
                            data[index]['@_lng'],
                            data[index]['@_lat']
                        ]
                    },
                    location_properties: helpers_crawler.earthquakes.location_properties(data[index]['@_lng'], data[index]['@_lat']),
                    rev,
                    date_time: helpers.date.moment.moment(data[index]['@_name'], 'Y.M.D HH:mm:ss').format('YYYY-MM-DD HH:mm:ss'),
                    created_at: parseInt(helpers.date.moment.moment(data[index]['@_name'], 'Y.M.D HH:mm:ss').format('X'), 10),
                    location_tz: 'Europe/Istanbul'
                }
            );
        }
        return { data: model_data, metadata: { total: data.length } };
    } catch (error) {
        console.error(error);
        return false;
    }
};