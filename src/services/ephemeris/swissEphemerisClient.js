const swisseph = require('swisseph');
const config = require('../../config/env');

swisseph.swe_set_ephe_path(config.ephemeris.path);

/** Planet IDs used throughout the app, in display order. */
const PLANETS = [
  { key: 'sun', id: swisseph.SE_SUN, name: 'Sun' },
  { key: 'moon', id: swisseph.SE_MOON, name: 'Moon' },
  { key: 'mercury', id: swisseph.SE_MERCURY, name: 'Mercury' },
  { key: 'venus', id: swisseph.SE_VENUS, name: 'Venus' },
  { key: 'mars', id: swisseph.SE_MARS, name: 'Mars' },
  { key: 'jupiter', id: swisseph.SE_JUPITER, name: 'Jupiter' },
  { key: 'saturn', id: swisseph.SE_SATURN, name: 'Saturn' },
  { key: 'uranus', id: swisseph.SE_URANUS, name: 'Uranus' },
  { key: 'neptune', id: swisseph.SE_NEPTUNE, name: 'Neptune' },
  { key: 'pluto', id: swisseph.SE_PLUTO, name: 'Pluto' },
  { key: 'northNode', id: swisseph.SE_TRUE_NODE, name: 'North Node' },
  { key: 'chiron', id: swisseph.SE_CHIRON, name: 'Chiron' },
];

/** House-system code expected by swe_houses (single char). */
const HOUSE_SYSTEM_CODES = {
  placidus: 'P',
  whole_sign: 'W',
  koch: 'K',
  equal: 'A', // 'A' = Equal (Asc) in Swiss Ephemeris's house-system codes
};

function julianDayUT(date) {
  // date: a JS Date already normalized to UTC
  const hourDecimal =
    date.getUTCHours() + date.getUTCMinutes() / 60 + date.getUTCSeconds() / 3600;
  return new Promise((resolve, reject) => {
    try {
      swisseph.swe_julday(
        date.getUTCFullYear(),
        date.getUTCMonth() + 1,
        date.getUTCDate(),
        hourDecimal,
        swisseph.SE_GREG_CAL,
        (jd) => resolve(jd)
      );
    } catch (err) {
      reject(err);
    }
  });
}

function calcPlanetUT(jd, planetId, flags = swisseph.SEFLG_SPEED | swisseph.SEFLG_SWIEPH) {
  return new Promise((resolve, reject) => {
    swisseph.swe_calc_ut(jd, planetId, flags, (body) => {
      if (body.error) return reject(new Error(body.error));
      resolve(body);
    });
  });
}

function calcHouses(jd, latitude, longitude, houseSystem = 'placidus') {
  const code = HOUSE_SYSTEM_CODES[houseSystem] || 'P';
  return new Promise((resolve, reject) => {
    try {
      const result = swisseph.swe_houses(jd, latitude, longitude, code);
      if (!result || result.error) return reject(new Error(result?.error || 'swe_houses failed'));
      resolve(result);
    } catch (err) {
      reject(err);
    }
  });
}

function ayanamsaLahiri(jd) {
  return new Promise((resolve, reject) => {
    try {
      swisseph.swe_set_sid_mode(swisseph.SE_SIDM_LAHIRI, 0, 0);
      const value = swisseph.swe_get_ayanamsa_ut(jd);
      resolve(value);
    } catch (err) {
      reject(err);
    }
  });
}

module.exports = {
  swisseph,
  PLANETS,
  HOUSE_SYSTEM_CODES,
  julianDayUT,
  calcPlanetUT,
  calcHouses,
  ayanamsaLahiri,
};
