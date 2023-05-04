const db = require('../../db');

module.exports.dateBy = async (match) => {
    const query = await new db.MongoDB.CRUD('earthquake', 'data_v2').aggregate(
        [
            {
                $match: match,
            },
            {
                $addFields: {
                    date_time: {
                        $dateFromString: {
                            dateString: '$date_time',
                            format: '%Y-%m-%d %H:%M:%S',
                        },
                    },
                },
            },
            {
                $group: {
                    _id: {
                        $dateToString: {
                            format: '%m-%d',
                            date: '$date_time',
                        },
                    },
                    total: {
                        $sum: 1
                    },
                },
            },
            {
                $sort: { total: -1 }
            },
            {
                $limit: 10
            }
        ]
    );
    if (query === false) {
        throw Error('db error!');
    }
    return query;
};

module.exports.hourBy = async (match) => {
    const query = await new db.MongoDB.CRUD('earthquake', 'data_v2').aggregate(
        [
            {
                $match: match,
            },
            {
                $addFields: {
                    date_time: {
                        $dateFromString: {
                            dateString: '$date_time',
                            format: '%Y-%m-%d %H:%M:%S',
                        },
                    },
                },
            },
            {
                $group: {
                    _id: {
                        $dateToString: {
                            format: '%H',
                            date: '$date_time',
                        },
                    },
                    total: {
                        $sum: 1,
                    },
                },
            },
            {
                $sort: { total: -1 }
            }
        ]
    );
    if (query === false) {
        throw Error('db error!');
    }
    return query;
};

module.exports.epiCenterBy = async (match) => {
    const query = await new db.MongoDB.CRUD('earthquake', 'data_v2').aggregate(
        [
            {
                $match: match
            },
            {
                $group: {
                    _id: '$location_properties.epiCenter.name',
                    total: {
                        $sum: 1
                    }
                }
            },
            {
                $sort: {
                    total: -1
                }
            },
            {
                $limit: 5
            }
        ]
    );
    if (query === false) {
        throw Error('db error!');
    }
    return query;
};

module.exports.magBy = async (match) => {
    const query = await new db.MongoDB.CRUD('earthquake', 'data_v2').aggregate(
        [
            {
                $match: match
            },
            {
                $group: {
                    _id: { $toInt: '$mag' },
                    total: {
                        $sum: 1
                    },
                    epiCenter: {
                        $addToSet:
                            '$location_properties.epiCenter.name'
                    }
                }
            },
            {
                $sort: {
                    total: -1
                }
            }
        ]
    );
    if (query === false) {
        throw Error('db error!');
    }
    return query;
};

module.exports.airportsBy = async (match) => {
    const query = await new db.MongoDB.CRUD('earthquake', 'data_v2').aggregate(
        [
            {
                $match: match
            },
            {
                $group: {
                    _id: { $first: '$location_properties.airports.name' },
                    total: {
                        $sum: 1,
                    },
                }
            },
            {
                $sort: {
                    total: -1,
                }
            },
            {
                $limit: 5
            }
        ]
    );
    if (query === false) {
        throw Error('db error!');
    }
    return query;
};

module.exports.epiCenters = () => {
    let result = [];
    for (let index = 0; index < db.locations.geojsons.length; index++) {
        result.push(
            {
                city: db.locations.geojsons[index].name,
                cityCode: db.locations.geojsons[index].number,
                population: db.populations[db.locations.geojsons[index].number]?.population
            }
        );
    }
    return result.sort((a, b) => {
        const nameA = a.city.toUpperCase(); // ignore upper and lowercase
        const nameB = b.city.toUpperCase(); // ignore upper and lowercase
        if (nameA < nameB) {
            return -1;
        }
        if (nameA > nameB) {
            return 1;
        }
        // names must be equal
        return 0;
    });
};