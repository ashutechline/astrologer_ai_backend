const SunCalc = require('suncalc');
const moment = require('moment-timezone');
const { calculateCurrentSky } = require('./ephemeris/transitService');
const { angularDifference } = require('./ephemeris/astrologyMath');

const MOON_PHASES = [
  { name: 'New Moon', max: 22.5 },
  { name: 'Waxing Crescent', max: 67.5 },
  { name: 'First Quarter', max: 112.5 },
  { name: 'Waxing Gibbous', max: 157.5 },
  { name: 'Full Moon', max: 202.5 },
  { name: 'Waning Gibbous', max: 247.5 },
  { name: 'Last Quarter', max: 292.5 },
  { name: 'Waning Crescent', max: 337.5 },
  { name: 'New Moon', max: 360.01 },
];

const TRANSIT_INTERPRETATIONS = {
  1: 'Self Discovery',
  2: 'Financial Focus',
  3: 'Communication',
  4: 'Home & Roots',
  5: 'Creative Joy',
  6: 'Assertive Work',
  7: 'Relationships',
  8: 'Deep Transformation',
  9: 'Higher Learning',
  10: 'Career Ambitions',
  11: 'Social Networking',
  12: 'Rest & Healing',
};

function getMoonPhaseName(sunLongitude, moonLongitude) {
  const elongation = ((moonLongitude - sunLongitude) % 360 + 360) % 360;
  return MOON_PHASES.find((p) => elongation <= p.max)?.name || 'New Moon';
}

function getTransitHouse(moonLongitude, natalHouses) {
  if (!natalHouses || natalHouses.length !== 12) return null;
  // Houses are assumed to be sorted by house number 1 to 12
  for (let i = 0; i < 12; i++) {
    const currentHouse = natalHouses[i];
    const nextHouse = natalHouses[(i + 1) % 12];
    
    let start = currentHouse.longitude;
    let end = nextHouse.longitude;
    
    // Handle wrapping around 360 degrees
    if (end <= start) {
      if (moonLongitude >= start || moonLongitude < end) {
        return currentHouse.house;
      }
    } else {
      if (moonLongitude >= start && moonLongitude < end) {
        return currentHouse.house;
      }
    }
  }
  return null;
}

function formatTime(date, timezone) {
  if (!date || isNaN(date.getTime())) return '-';
  return moment(date).tz(timezone).format('h:mm A');
}

/**
 * Produces a simple 1-10 "cosmic energy" score for the Home dashboard.
 * Also calculates Sun and Moon times, and Transit Moon if natal chart provided.
 */
async function getCosmicWeather({ natalPlanets = null, natalHouses = null, atDate = new Date(), lat, lng, timezone = 'UTC' }) {
  const { planets } = await calculateCurrentSky(atDate);
  const sun = planets.find((p) => p.key === 'sun');
  const moon = planets.find((p) => p.key === 'moon');

  const moonPhase = getMoonPhaseName(sun.longitude, moon.longitude);
  const moonDegree = Math.floor(moon.longitude % 30);
  const moonMinute = Math.floor(((moon.longitude % 30) - moonDegree) * 60);
  const moonDegreeStr = `${moonDegree}°${moonMinute.toString().padStart(2, '0')}'`;

  const fastPlanets = planets.filter((p) => ['sun', 'moon', 'mercury', 'venus', 'mars'].includes(p.key));
  let harmonious = 0;
  let tense = 0;
  for (let i = 0; i < fastPlanets.length; i++) {
    for (let j = i + 1; j < fastPlanets.length; j++) {
      const diff = angularDifference(fastPlanets[i].longitude, fastPlanets[j].longitude);
      if (Math.abs(diff - 60) < 6 || Math.abs(diff - 120) < 6) harmonious++;
      if (Math.abs(diff - 90) < 6 || Math.abs(diff - 180) < 6) tense++;
    }
  }
  const score = Math.max(1, Math.min(10, 5 + harmonious - tense));

  // SunCalc astronomical times
  let sunrise = '-', sunset = '-', moonrise = '-', moonset = '-';
  if (lat != null && lng != null) {
    const sunTimes = SunCalc.getTimes(atDate, lat, lng);
    sunrise = formatTime(sunTimes.sunrise, timezone);
    sunset = formatTime(sunTimes.sunset, timezone);

    const moonTimes = SunCalc.getMoonTimes(atDate, lat, lng);
    moonrise = formatTime(moonTimes.rise, timezone);
    moonset = formatTime(moonTimes.set, timezone);
  }

  const transitHouse = getTransitHouse(moon.longitude, natalHouses);
  const transitInterpretation = transitHouse ? TRANSIT_INTERPRETATIONS[transitHouse] : null;

  return {
    moonPhase,
    moonDegree: moonDegreeStr,
    sunSign: sun.sign,
    moonSign: moon.sign,
    sunrise,
    sunset,
    moonrise,
    moonset,
    transitHouse,
    transitInterpretation,
    energyScore: score,
    planetsSummary: planets.map((p) => `${p.name} in ${p.sign}${p.retrograde ? ' (Rx)' : ''}`),
  };
}

module.exports = { getCosmicWeather, getMoonPhaseName };
