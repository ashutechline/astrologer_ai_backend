const { CalendarEvent } = require('../models/Content');
const BirthChart = require('../models/BirthChart');
const ApiError = require('../utils/ApiError');
const { sendSuccess } = require('../utils/apiResponse');
const { calculateLiveTransits, findUpcomingReturns } = require('../services/ephemeris/transitService');

/** GET /calendar/month?year=&month= */
async function getMonthCalendar(req, res) {
  const { year, month } = req.query; // month: 1-12
  const start = new Date(Date.UTC(year, month - 1, 1));
  const end = new Date(Date.UTC(year, month, 1));

  const events = await CalendarEvent.find({ date: { $gte: start, $lt: end } }).sort({ date: 1 });

  // Build a day-by-day energy map for the month grid's colored dots
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const dayMap = {};
  for (let d = 1; d <= daysInMonth; d++) dayMap[d] = 'green';
  for (const ev of events) {
    const day = ev.date.getUTCDate();
    if (ev.energyRating === 'red') dayMap[day] = 'red';
    else if (ev.energyRating === 'amber' && dayMap[day] !== 'red') dayMap[day] = 'amber';
  }

  sendSuccess(res, { data: { year: Number(year), month: Number(month), events, dayEnergy: dayMap } });
}

/** GET /calendar/day?date=&chartId= */
async function getDayDetail(req, res) {
  const { date } = req.query;
  const dayStart = new Date(`${date}T00:00:00.000Z`);
  const dayEnd = new Date(`${date}T23:59:59.999Z`);

  const events = await CalendarEvent.find({
    $or: [
      { date: { $gte: dayStart, $lte: dayEnd } },
      { date: { $lte: dayEnd }, endDate: { $gte: dayStart } }, // retrograde windows spanning this day
    ],
  });

  sendSuccess(res, { data: { date, events } });
}

/** GET /transits/live?chartId= */
async function getLiveTransits(req, res) {
  const { chartId } = req.query;
  const chart = await BirthChart.findOne({ _id: chartId, owner: req.userId });
  if (!chart) throw ApiError.notFound('Chart not found', 'CHART_NOT_FOUND');

  const transits = await calculateLiveTransits(chart.computed.planets);
  sendSuccess(res, { data: transits });
}

/** GET /transits/timeline?chartId=&months=12 */
async function getTransitTimeline(req, res) {
  const { chartId, months } = req.query;
  const chart = await BirthChart.findOne({ _id: chartId, owner: req.userId });
  if (!chart) throw ApiError.notFound('Chart not found', 'CHART_NOT_FOUND');

  const isPro = req.user.subscription.isPro;
  const monthsRequested = Number(months) || 12;
  const monthsAllowed = isPro ? monthsRequested : Math.min(monthsRequested, 3); // free preview: first 3 months only

  const monthlySnapshots = [];
  for (let i = 0; i < monthsAllowed; i++) {
    const checkDate = new Date();
    checkDate.setUTCMonth(checkDate.getUTCMonth() + i);
    const transits = await calculateLiveTransits(chart.computed.planets, checkDate);
    monthlySnapshots.push({
      monthOffset: i,
      monthLabel: checkDate.toISOString().slice(0, 7),
      majorTransits: transits.filter((t) => t.impact === 'Major'),
    });
  }

  sendSuccess(res, {
    data: { timeline: monthlySnapshots, isLimitedPreview: !isPro && monthsRequested > 3 },
  });
}

/** GET /transits/returns?chartId= */
async function getReturns(req, res) {
  const { chartId } = req.query;
  const chart = await BirthChart.findOne({ _id: chartId, owner: req.userId });
  if (!chart) throw ApiError.notFound('Chart not found', 'CHART_NOT_FOUND');

  const returns = await findUpcomingReturns(chart.computed.planets, 12);
  sendSuccess(res, { data: returns });
}

/** POST /planner/best-day */
async function planBestDay(req, res) {
  const { chartId, activityType, dateRange } = req.body;
  const chart = await BirthChart.findOne({ _id: chartId, owner: req.userId });
  if (!chart) throw ApiError.notFound('Chart not found', 'CHART_NOT_FOUND');

  const start = new Date(dateRange.start);
  const end = new Date(dateRange.end);
  const dayMs = 24 * 60 * 60 * 1000;
  const candidates = [];

  for (let t = start.getTime(); t <= end.getTime(); t += dayMs) {
    const checkDate = new Date(t);
    const transits = await calculateLiveTransits(chart.computed.planets, checkDate);
    const harmonious = transits.filter((tr) => ['Trine', 'Sextile'].includes(tr.aspect)).length;
    const tense = transits.filter((tr) => ['Square', 'Opposition'].includes(tr.aspect)).length;
    candidates.push({ date: checkDate.toISOString().slice(0, 10), score: harmonious - tense, transitCount: transits.length });
  }

  candidates.sort((a, b) => b.score - a.score);

  sendSuccess(res, { data: { activityType, bestDays: candidates.slice(0, 5), allDays: candidates } });
}

/** GET /calendar/upcoming?limit=3 */
async function getUpcomingEvents(req, res) {
  const limit = parseInt(req.query.limit, 10) || 3;
  const now = new Date();
  const events = await CalendarEvent.find({ date: { $gte: now } })
    .sort({ date: 1 })
    .limit(limit);

  sendSuccess(res, { data: events });
}

module.exports = {
  getMonthCalendar,
  getDayDetail,
  getLiveTransits,
  getTransitTimeline,
  getReturns,
  planBestDay,
  getUpcomingEvents,
};
