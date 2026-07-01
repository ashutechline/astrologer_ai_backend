const ZODIAC_SIGNS = [
  'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
  'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces',
];

/** @param {number} longitude - ecliptic longitude in degrees [0, 360) */
function longitudeToSign(longitude) {
  const norm = ((longitude % 360) + 360) % 360;
  const signIndex = Math.floor(norm / 30);
  const degreeInSign = norm - signIndex * 30;
  return { sign: ZODIAC_SIGNS[signIndex], degreeInSign, absoluteDegree: norm };
}

/** Major aspects with their target angle and default orb (degrees of allowed deviation). */
const ASPECT_DEFINITIONS = [
  { name: 'Conjunction', symbol: '☌', angle: 0, orb: 8 },
  { name: 'Sextile', symbol: '⚹', angle: 60, orb: 6 },
  { name: 'Square', symbol: '□', angle: 90, orb: 8 },
  { name: 'Trine', symbol: '▲', angle: 120, orb: 8 },
  { name: 'Opposition', symbol: '☍', angle: 180, orb: 8 },
];

function angularDifference(a, b) {
  let diff = Math.abs(a - b) % 360;
  if (diff > 180) diff = 360 - diff;
  return diff;
}

/**
 * Computes all major aspects between two sets of planet positions.
 * @param {Array<{key,name,longitude}>} pointsA
 * @param {Array<{key,name,longitude}>} pointsB
 * @param {boolean} skipSelfPairs - true for natal aspects (don't compare a planet to itself)
 */
function computeAspects(pointsA, pointsB, skipSelfPairs = true) {
  const aspects = [];
  for (const p1 of pointsA) {
    for (const p2 of pointsB) {
      if (skipSelfPairs && p1.key === p2.key) continue;
      const diff = angularDifference(p1.longitude, p2.longitude);
      for (const def of ASPECT_DEFINITIONS) {
        const delta = Math.abs(diff - def.angle);
        if (delta <= def.orb) {
          aspects.push({
            planetA: p1.key,
            planetB: p2.key,
            aspect: def.name,
            symbol: def.symbol,
            angle: def.angle,
            exactOrb: Number(delta.toFixed(2)),
            applying: null, // could be derived from relative speed if needed
          });
          break; // a pair has at most one major aspect
        }
      }
    }
  }
  return aspects;
}

module.exports = { ZODIAC_SIGNS, longitudeToSign, ASPECT_DEFINITIONS, computeAspects, angularDifference };
