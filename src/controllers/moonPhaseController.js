const moonPhaseService = require('../services/moonPhaseService');
const { sendSuccess } = require('../utils/apiResponse');
const ApiError = require('../utils/ApiError');

exports.getCurrentPhase = async (req, res) => {
  const dateStr = req.query.date || new Date().toISOString();
  const date = new Date(dateStr);
  
  if (isNaN(date.getTime())) {
    throw new ApiError(400, 'Invalid date format');
  }

  const data = await moonPhaseService.getCurrentMoonPhase(date);
  sendSuccess(res, { data });
};

exports.getUpcomingPhases = async (req, res) => {
  const startDateStr = req.query.startDate || new Date().toISOString();
  const days = parseInt(req.query.days, 10) || 30;
  
  const startDate = new Date(startDateStr);
  if (isNaN(startDate.getTime())) {
    throw new ApiError(400, 'Invalid date format');
  }

  const data = await moonPhaseService.getUpcomingMoonPhases(startDate, days);
  sendSuccess(res, { data });
};

exports.getPhaseByDate = async (req, res) => {
  const dateStr = req.params.date;
  const date = new Date(dateStr);
  
  if (isNaN(date.getTime())) {
    throw new ApiError(400, 'Invalid date format');
  }

  const data = await moonPhaseService.getMoonPhaseForDate(date);
  sendSuccess(res, { data });
};
