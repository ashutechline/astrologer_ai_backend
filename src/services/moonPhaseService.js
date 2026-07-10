const MoonPhase = require('../models/MoonPhase');
const { getMoonPhaseData, getUpcomingPhases } = require('./ephemeris/moonCalculations');

async function getCurrentMoonPhase(date = new Date()) {
  const moonData = await getMoonPhaseData(date);
  const phaseInterpretation = await MoonPhase.findOne({ phase: moonData.phase }).lean();

  if (!phaseInterpretation) {
    throw new Error(`Interpretation for phase ${moonData.phase} not found in database.`);
  }

  return {
    ...moonData,
    interpretation: phaseInterpretation
  };
}

async function getUpcomingMoonPhases(startDate = new Date(), limitDays = 30) {
  const upcomingPhases = await getUpcomingPhases(startDate, limitDays);
  
  // Fetch all interpretations at once to avoid N+1 queries
  const interpretations = await MoonPhase.find().lean();
  const interpretationMap = interpretations.reduce((acc, curr) => {
    acc[curr.phase] = curr;
    return acc;
  }, {});

  return upcomingPhases.map(phaseData => {
    return {
      ...phaseData,
      interpretation: interpretationMap[phaseData.phase]
    };
  });
}

async function getMoonPhaseForDate(date) {
  return getCurrentMoonPhase(date);
}

module.exports = {
  getCurrentMoonPhase,
  getUpcomingMoonPhases,
  getMoonPhaseForDate
};
