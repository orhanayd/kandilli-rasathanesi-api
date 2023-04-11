let adriyatikDenizi = require('./adriyatik-denizi');
const arnavutluk = require('./arnavutluk');
const azerbaycan = require('./azerbaycan');
const bosnaHersek = require('./bosna-hersek');
const bulgaristan = require('./bulgaristan');
const ermenistan = require('./ermenistan');
const filistin = require('./filistin');
const gurcistan = require('./gurcistan');
const hirvatistan = require('./hirvatistan');
const irak = require('./irak');
const iran = require('./iran');
const israil = require('./israil');
const libya = require('./libya');
const lubnan = require('./lubnan');
const makedonya = require('./makedonya');
const misir = require('./misir');
const montenegro = require('./montenegro');
const rusya = require('./rusya');
const sirbistan = require('./sirbistan');
const suriye = require('./suriye');
const urdun = require('./urdun');
const yunanistan = require('./yunanistan');
const mixedLocations = require('./mixed-locations.min');
const kibris = require('./kibris');

module.exports = [
    kibris,
    adriyatikDenizi,
    arnavutluk,
    azerbaycan,
    bosnaHersek,
    bulgaristan,
    ermenistan,
    filistin,
    gurcistan,
    hirvatistan,
    irak,
    iran,
    israil,
    libya,
    lubnan,
    makedonya,
    misir,
    montenegro,
    rusya,
    sirbistan,
    suriye,
    urdun,
    yunanistan,
    ...mixedLocations
];