const moment = require('moment-timezone');
const constants = require('./../../constants');
const helpers = require('./../../helpers');
/**
 * get timestamp
 *
 * @returns {Number}
 */
module.exports.timestamp = () => {
	return parseInt(moment().format('X'), 10);
};

/**
 * get timestamp ms
 *
 * @returns {Number}
 */
module.exports.timestampMS = () => {
	return parseInt(moment().format('x'), 10);
};

/**
 * moment object
 *
 * @param  {...any} args
 * @returns
 */
module.exports.moment = (...args) => {
	return moment(...args);
};

module.exports.isValid = (date, format = 'YYYYMMDD') => {
	return moment(date, format, true).isValid();
};

module.exports.timeCategory = (time, timeFormat = 'HH:mm:ss') => {
	if (
		time.isBetween(moment('00:00:00', timeFormat), moment('04:59:59', timeFormat)) ||
		time.isSame(moment('00:00:00', timeFormat)) ||
		time.isSame(moment('04:59:59', timeFormat))
	) {
		return constants.stopTimes.TIME_CATEGORIES.DAWN;
	}
	if (
		time.isBetween(moment('05:00:00', timeFormat), moment('11:59:59', timeFormat)) ||
		time.isSame(moment('05:00:00', timeFormat)) ||
		time.isSame(moment('11:59:59', timeFormat))
	) {
		return constants.stopTimes.TIME_CATEGORIES.MORNING;
	}
	if (
		time.isBetween(moment('12:00:00', timeFormat), moment('16:59:59', timeFormat)) ||
		time.isSame(moment('12:00:00', timeFormat)) ||
		time.isSame(moment('16:59:59', timeFormat))
	) {
		return constants.stopTimes.TIME_CATEGORIES.NOON;
	}
	if (
		time.isBetween(moment('17:00:00', timeFormat), moment('23:59:59', timeFormat)) ||
		time.isSame(moment('17:00:00', timeFormat)) ||
		time.isSame(moment('23:59:59', timeFormat))
	) {
		return constants.stopTimes.TIME_CATEGORIES.NIGHT;
	}
};

/**
 * get date ranges
 *
 * @param {string} start
 * @param {string} end
 * @param {string} fomat
 * @returns
 */
module.exports.dateRanges = (start, end, format = 'YYYY-MM-DD') => {
	try {
		const range = moment(end).diff(moment(start).format(format), 'days');
		const rangeDates = [];
		rangeDates.push(moment(start).format(format));
		for (let index = 0; index < range; index++) {
			const date = moment(start)
				.add({ days: index + 1 })
				.format(format);
			rangeDates.push(date);
		}
		return rangeDates;
	} catch (error) {
		helpers.error.logger(error);
		return false;
	}
};

/**
 * get date ranges filter with service_id
 *
 * @param {string} start
 * @param {string} end
 * @param {array<string>} service_id { "monday": "0", "tuesday": "0", "wednesday": "0" ... }
 * @param {string} format
 * @returns
 */
module.exports.dateRangesWithService = (start, end, service_id = {}, format = 'YYYY-MM-DD') => {
	try {
		const range = moment(end).diff(moment(start).format(format), 'days');
		const rangeDates = [];
		if (service_id[moment(start).format('dddd').toLowerCase()]) {
			rangeDates.push(moment(start).format(format));
		}
		for (let index = 0; index < range; index++) {
			const date = moment(start).add({ days: index + 1 });
			if (service_id[date.format('dddd').toLowerCase()] === '1') {
				rangeDates.push(date.format(format));
			}
		}
		return rangeDates;
	} catch (error) {
		helpers.error.logger(error);
		return false;
	}
};
