const helpers = require('../../helpers');

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
                    title: data[index]['@_lokasyon'],
                    date: data[index]['@_name'],
                    lokasyon: data[index]['@_lokasyon'],
                    lat: data[index]['@_lat'],
                    lng: data[index]['@_lng'],
                    mag: parseFloat(data[index]['@_mag']),
                    depth: parseFloat(data[index]['@_Depth']),
                    coordinates: [
                        data[index]['@_lng'],
                        data[index]['@_lat']
                    ],
                    geojson: {
                        'type': 'Point',
                        'coordinates': [
                            data[index]['@_lng'],
                            data[index]['@_lat']
                        ]
                    },
                    rev,
                    date_stamp: helpers.date.moment.moment(data[index]['@_name'], 'Y.M.D HH:mm:ss').format('Y-MM-DD'),
                    date_day: helpers.date.moment.moment(data[index]['@_name'], 'Y.M.D HH:mm:ss').format('Y-MM-DD'),
                    date_hour: helpers.date.moment.moment(data[index]['@_name'], 'Y.M.D HH:mm:ss').format('HH:mm:ss'),
                    timestamp: helpers.date.moment.moment(data[index]['@_name'], 'Y.M.D HH:mm:ss').format('X'),
                    location_tz: 'Europe/Istanbul'
                }
            );
        }
        return model_data;
    } catch (error) {
        console.error(error);
        return false;
    }
};