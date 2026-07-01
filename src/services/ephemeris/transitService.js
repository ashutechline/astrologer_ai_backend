const { PLANETS, julianDayUT, calcPlanetUT } = require('./swissEphemerisClient');
const { longitudeToSign, computeAspects } = require('./astrologyMath');

/** Computes current planetary positions for an arbitrary UTC instant ("the sky right now"). */
async function calculateCurrentSky(atDate = new Date()) {
  const jd = await julianDayUT(atDate);
  const planets = [];
  for (const planet of PLANETS) {
    const body = await calcPlanetUT(jd, planet.id);
    const { sign, degreeInSign } = longitudeToSign(body.longitude);
    planets.push({
      key: planet.key,
      name: planet.name,
      longitude: body.longitude,
      sign,
      degreeInSign: Number(degreeInSign.toFixed(2)),
      speed: body.longitudeSpeed,
      retrograde: body.longitudeSpeed < 0,
    });
  }
  return { jd, planets };
}

/** Maps an aspect type to a simple impact tier used by the Transits screen. */
function impactLevelFor(transitPlanetKey, aspectName) {
  const majorOuter = ['saturn', 'uranus', 'neptune', 'pluto'];
  if (majorOuter.includes(transitPlanetKey) && ['Conjunction', 'Opposition', 'Square'].includes(aspectName)) {
    return 'Major';
  }
  if (['Conjunction', 'Opposition', 'Square'].includes(aspectName)) return 'Moderate';
  return 'Minor';
}

/**
 * Computes live transits: current sky planets aspecting a user's natal planets.
 * @param {Array} natalPlanets - chart.planets from calculateNatalChart
 */
async function calculateLiveTransits(natalPlanets, atDate = new Date()) {
  const { planets: currentPlanets } = await calculateCurrentSky(atDate);
  const rawAspects = computeAspects(currentPlanets, natalPlanets, false);

  return rawAspects.map((a) => ({
    ...a,
    transitPlanet: a.planetA,
    natalPlanet: a.planetB,
    impact: impactLevelFor(a.planetA, a.aspect),
  }));
}

/**
 * Checks for upcoming Saturn Return (~29.5yr cycle) and Jupiter Return (~12yr cycle)
 * by comparing current Saturn/Jupiter longitude against the natal position, scanning
 * forward day-by-day for the next conjunction within the given window.
 */
async function findUpcomingReturns(natalPlanets, monthsAhead = 12) {
  const saturnNatal = natalPlanets.find((p) => p.key === 'saturn');
  const jupiterNatal = natalPlanets.find((p) => p.key === 'jupiter');
  const results = [];

  const targets = [
    { key: 'saturn', natal: saturnNatal, label: 'Saturn Return' },
    { key: 'jupiter', natal: jupiterNatal, label: 'Jupiter Return' },
  ];

  const now = new Date();
  const stepDays = 5; // coarse scan is fine for an alert banner, not exact-degree precision
  const totalSteps = Math.ceil((monthsAhead * 30) / stepDays);

  for (const target of targets) {
    if (!target.natal) continue;
    for (let i = 0; i <= totalSteps; i++) {
      const checkDate = new Date(now.getTime() + i * stepDays * 24 * 60 * 60 * 1000);
      const { planets } = await calculateCurrentSky(checkDate);
      const current = planets.find((p) => p.key === target.key);
      const diff = Math.abs(current.longitude - target.natal.longitude);
      const normDiff = diff > 180 ? 360 - diff : diff;
      if (normDiff <= 1) {
        results.push({ planet: target.key, label: target.label, approxDate: checkDate });
        break;
      }
    }
  }

  return results;
}

module.exports = { calculateCurrentSky, calculateLiveTransits, findUpcomingReturns, impactLevelFor };
