const BirthChart = require('../models/BirthChart');
const { calculateNatalChart } = require('./ephemeris/chartCalculationService');
const ApiError = require('../utils/ApiError');

const FREE_CHART_LIMIT = 1; // free tier: only the user's own primary chart; saving extra charts is premium

async function computeAndAttach(chartDoc) {
  const result = await calculateNatalChart({
    date: chartDoc.birthDate,
    time: chartDoc.birthTime,
    latitude: chartDoc.birthPlace.latitude,
    longitude: chartDoc.birthPlace.longitude,
    utcOffsetMinutes: chartDoc.birthPlace.utcOffsetMinutes,
    houseSystem: chartDoc.houseSystem,
    zodiacSystem: chartDoc.zodiacSystem,
    timeUnknown: chartDoc.timeUnknown,
  });

  chartDoc.computed = {
    jd: result.jd,
    planets: result.planets,
    houses: result.houses || [],
    ascendant: result.ascendant,
    midheaven: result.midheaven,
    aspects: result.aspects,
    sunSign: result.sunSign,
    moonSign: result.moonSign,
    risingSign: result.risingSign,
    computedAt: new Date(),
  };

  return chartDoc;
}

async function createChart(userId, input, isPro, { bypassVaultLimit = false } = {}) {
  // if (!isPro && !bypassVaultLimit) {
  //   const existingCount = await BirthChart.countDocuments({ owner: userId });
  //   if (existingCount >= FREE_CHART_LIMIT) {
  //     throw ApiError.paymentRequired(
  //       'Saving multiple charts requires a Pro subscription. Upgrade to unlock the full chart vault.',
  //       'CHART_VAULT_LIMIT'
  //     );
  //   }
  // }

  const chart = new BirthChart({ owner: userId, ...input });
  await computeAndAttach(chart);
  await chart.save();
  return chart;
}

async function recalculateChart(chart) {
  await computeAndAttach(chart);
  await chart.save();
  return chart;
}

module.exports = { createChart, recalculateChart, computeAndAttach, FREE_CHART_LIMIT };
