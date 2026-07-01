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

function getMoonPhaseName(sunLongitude, moonLongitude) {
  const elongation = ((moonLongitude - sunLongitude) % 360 + 360) % 360;
  return MOON_PHASES.find((p) => elongation <= p.max)?.name || 'New Moon';
}

/**
 * Produces a simple 1-10 "cosmic energy" score for the Home dashboard.
 * Heuristic: counts harmonious aspects (trine/sextile) among the day's fast-moving
 * planets vs. tense ones (square/opposition) as a lightweight, explainable signal —
 * not a claim of astrological authority, just a stable, deterministic score for the UI.
 */
async function getCosmicWeather(natalPlanets = null, atDate = new Date()) {
  const { planets } = await calculateCurrentSky(atDate);
  const sun = planets.find((p) => p.key === 'sun');
  const moon = planets.find((p) => p.key === 'moon');

  const moonPhase = getMoonPhaseName(sun.longitude, moon.longitude);

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

  return {
    moonPhase,
    sunSign: sun.sign,
    moonSign: moon.sign,
    energyScore: score,
    planetsSummary: planets.map((p) => `${p.name} in ${p.sign}${p.retrograde ? ' (Rx)' : ''}`),
  };
}

module.exports = { getCosmicWeather, getMoonPhaseName };
