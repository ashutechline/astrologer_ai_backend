const { computeAspects, longitudeToSign } = require('./astrologyMath');

/** Weighted scoring for synastry — heuristic, not a claim of astrological precision. */
const SCORE_WEIGHTS = {
  love: { planets: ['venus', 'mars', 'moon', 'sun'], aspectWeight: { Trine: 3, Sextile: 2, Conjunction: 2, Square: -2, Opposition: -1 } },
  communication: { planets: ['mercury', 'moon', 'sun'], aspectWeight: { Trine: 3, Sextile: 2, Conjunction: 1, Square: -2, Opposition: -1 } },
  values: { planets: ['jupiter', 'saturn', 'sun', 'moon'], aspectWeight: { Trine: 3, Sextile: 2, Conjunction: 2, Square: -1, Opposition: -1 } },
};

function clampScore(raw) {
  // Map an arbitrary weighted sum onto a 0-100 band, centered around 50
  return Math.max(5, Math.min(100, Math.round(50 + raw * 4)));
}

function computeSynastryAspects(chartAPlanets, chartBPlanets) {
  return computeAspects(chartAPlanets, chartBPlanets, false);
}

function computeCompatibilityScores(synastryAspects) {
  const scores = {};
  for (const [category, { planets, aspectWeight }] of Object.entries(SCORE_WEIGHTS)) {
    let sum = 0;
    for (const asp of synastryAspects) {
      if (planets.includes(asp.planetA) || planets.includes(asp.planetB)) {
        sum += aspectWeight[asp.aspect] || 0;
      }
    }
    scores[category] = clampScore(sum);
  }
  return scores;
}

/** Composite chart: midpoint of each planet pair between the two charts. */
function computeCompositeChart(chartAPlanets, chartBPlanets) {
  const composite = [];
  for (const pa of chartAPlanets) {
    const pb = chartBPlanets.find((p) => p.key === pa.key);
    if (!pb) continue;
    let diff = pb.longitude - pa.longitude;
    if (diff > 180) diff -= 360;
    if (diff < -180) diff += 360;
    let midpoint = pa.longitude + diff / 2;
    midpoint = ((midpoint % 360) + 360) % 360;
    const { sign, degreeInSign } = longitudeToSign(midpoint);
    composite.push({ key: pa.key, name: pa.name, longitude: midpoint, sign, degreeInSign: Number(degreeInSign.toFixed(2)) });
  }
  return composite;
}

module.exports = { computeSynastryAspects, computeCompatibilityScores, computeCompositeChart };
