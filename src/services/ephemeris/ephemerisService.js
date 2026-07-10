const { PLANETS, julianDayUT, calcPlanetUT } = require('./swissEphemerisClient');
const { longitudeToSign } = require('./astrologyMath');

const INNER_PLANETS_KEYS = ['sun', 'moon', 'mercury', 'venus', 'mars'];
const OUTER_PLANETS_KEYS = ['jupiter', 'saturn', 'uranus', 'neptune', 'pluto']; // You can add 'northNode', 'chiron' here if needed

/**
 * Calculates daily planetary positions for a given month and year.
 * @param {number} year - The year (e.g. 2024)
 * @param {number} month - The month (1-12)
 * @returns {Array} Array of daily planetary positions
 */
async function getMonthlyEphemeris(year, month) {
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const dailyData = [];

  for (let day = 1; day <= daysInMonth; day++) {
    // We compute positions at midnight UTC
    const date = new Date(Date.UTC(year, month - 1, day, 0, 0, 0));
    const jd = await julianDayUT(date);

    const inner = [];
    const outer = [];

    for (const planet of PLANETS) {
      if (INNER_PLANETS_KEYS.includes(planet.key) || OUTER_PLANETS_KEYS.includes(planet.key)) {
        const body = await calcPlanetUT(jd, planet.id);
        const signInfo = longitudeToSign(body.longitude);
        const isRetrograde = body.speedInLongitude < 0 && planet.key !== 'sun' && planet.key !== 'moon' && planet.key !== 'northNode';

        const planetData = {
          key: planet.key,
          name: planet.name,
          sign: signInfo.sign,
          degree: Number(signInfo.degreeInSign.toFixed(2)),
          isRetrograde,
        };

        if (INNER_PLANETS_KEYS.includes(planet.key)) {
          inner.push(planetData);
        } else {
          outer.push(planetData);
        }
      }
    }

    dailyData.push({
      date: date.toISOString().split('T')[0],
      inner,
      outer
    });
  }

  return dailyData;
}

module.exports = {
  getMonthlyEphemeris
};
