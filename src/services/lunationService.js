const Lunation = require('../models/Lunation');
const { getUpcomingLunations } = require('./ephemeris/moonCalculations');

async function getCurrentLunation(date = new Date()) {
  // To get the "current" lunation, we look back 15 days and forward 15 days to find the nearest
  const pastDate = new Date(date.getTime() - 15 * 24 * 60 * 60 * 1000);
  const lunations = await getUpcomingLunations(pastDate, 1);
  
  // Find the one closest to 'date'
  let closest = null;
  let minDiff = Infinity;
  for (const lunation of lunations) {
      const diff = Math.abs(new Date(lunation.date).getTime() - date.getTime());
      if (diff < minDiff) {
          minDiff = diff;
          closest = lunation;
      }
  }

  if (!closest) {
      throw new Error("Could not calculate current lunation.");
  }

  const interpretation = await Lunation.findOne({ type: closest.type }).lean();
  return {
      ...closest,
      interpretation
  };
}

async function getUpcomingLunationEvents(startDate = new Date(), limitMonths = 12) {
  const upcomingLunations = await getUpcomingLunations(startDate, limitMonths);
  
  const interpretations = await Lunation.find().lean();
  const interpretationMap = interpretations.reduce((acc, curr) => {
    acc[curr.type] = curr;
    return acc;
  }, {});

  return upcomingLunations.map(lunation => {
    return {
      ...lunation,
      interpretation: interpretationMap[lunation.type]
    };
  });
}

async function getLunationForDate(date) {
  return getCurrentLunation(date); // Same logic: nearest lunation
}

module.exports = {
  getCurrentLunation,
  getUpcomingLunationEvents,
  getLunationForDate
};
