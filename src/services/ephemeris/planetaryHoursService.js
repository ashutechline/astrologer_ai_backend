const SunCalc = require('suncalc');
const { find } = require('geo-tz');
const moment = require('moment-timezone');

const CHALDEAN_ORDER = ['Saturn', 'Jupiter', 'Mars', 'Sun', 'Venus', 'Mercury', 'Moon'];
const DAY_RULERS = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn'];

/**
 * Calculates the planetary hours for a given date and location.
 * @param {string} dateStr - YYYY-MM-DD
 * @param {number} lat - Latitude
 * @param {number} lon - Longitude
 * @returns {Array} Array of 24 planetary hour objects
 */
function calculatePlanetaryHours(dateStr, lat, lon) {
  // Find timezone for the location to determine the correct local day of the week
  const tzList = find(lat, lon);
  const tz = tzList.length > 0 ? tzList[0] : 'UTC';

  // Get local noon on the requested date to find the local day of the week
  const localMoment = moment.tz(`${dateStr}T12:00:00`, tz);
  const dayOfWeek = localMoment.day(); // 0: Sunday, 1: Monday, etc.

  // Use noon UTC for SunCalc to avoid shifting to a different calendar day
  const baseDate = new Date(`${dateStr}T12:00:00Z`);

  const times = SunCalc.getTimes(baseDate, lat, lon);
  const sunrise = times.sunrise;
  const sunset = times.sunset;

  // Next day's sunrise for night hours calculation
  const nextDay = new Date(baseDate);
  nextDay.setUTCDate(nextDay.getUTCDate() + 1);
  const nextTimes = SunCalc.getTimes(nextDay, lat, lon);
  const nextSunrise = nextTimes.sunrise;

  // Validate times
  if (!sunrise || !sunset || !nextSunrise || isNaN(sunrise.getTime()) || isNaN(sunset.getTime()) || isNaN(nextSunrise.getTime())) {
    throw new Error('Unable to calculate sunrise/sunset for the given location and date (possible extreme latitude).');
  }

  // Duration of day and night hours in milliseconds
  const dayHourDuration = (sunset.getTime() - sunrise.getTime()) / 12;
  const nightHourDuration = (nextSunrise.getTime() - sunset.getTime()) / 12;

  let currentPlanetIndex = CHALDEAN_ORDER.indexOf(DAY_RULERS[dayOfWeek]);
  const hours = [];

  // Day Hours (1 to 12)
  for (let i = 0; i < 12; i++) {
    const start = new Date(sunrise.getTime() + i * dayHourDuration);
    const end = new Date(sunrise.getTime() + (i + 1) * dayHourDuration);
    hours.push({
      index: i + 1,
      isDay: true,
      planet: CHALDEAN_ORDER[currentPlanetIndex],
      startTime: start.toISOString(),
      endTime: end.toISOString(),
    });
    currentPlanetIndex = (currentPlanetIndex + 1) % 7;
  }

  // Night Hours (13 to 24)
  for (let i = 0; i < 12; i++) {
    const start = new Date(sunset.getTime() + i * nightHourDuration);
    const end = new Date(sunset.getTime() + (i + 1) * nightHourDuration);
    hours.push({
      index: i + 13,
      isDay: false,
      planet: CHALDEAN_ORDER[currentPlanetIndex],
      startTime: start.toISOString(),
      endTime: end.toISOString(),
    });
    currentPlanetIndex = (currentPlanetIndex + 1) % 7;
  }

  return hours;
}

module.exports = { calculatePlanetaryHours };
