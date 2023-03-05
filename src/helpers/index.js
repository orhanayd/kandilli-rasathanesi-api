module.exports.crawler = require('./crawler');
module.exports.date = require('./date');
module.exports.earthquakes = require('./earthquakes');

/**
 * meter to radius
 * 
 * @param {number} meter 
 * @returns {Number}
 */
module.exports.metersToRadios = (meter = 0) => {
    try {
        meter = parseInt(meter, 10);
        if (isNaN(meter)) {
            meter = false;
        }
        return ((meter * 0.0006213712) / 3963.2);
    } catch (error) {
        console.error(error);
        return false;
    }
};
