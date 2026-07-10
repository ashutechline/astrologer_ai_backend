const lunationService = require('../services/lunationService');
const { sendSuccess } = require('../utils/apiResponse');
const ApiError = require('../utils/ApiError');

exports.getCurrentLunation = async (req, res) => {
  const dateStr = req.query.date || new Date().toISOString();
  const date = new Date(dateStr);
  
  if (isNaN(date.getTime())) {
    throw new ApiError(400, 'Invalid date format');
  }

  const data = await lunationService.getCurrentLunation(date);
  sendSuccess(res, { data });
};

exports.getUpcomingLunations = async (req, res) => {
  const startDateStr = req.query.startDate || new Date().toISOString();
  const months = parseInt(req.query.months, 10) || 12;
  
  const startDate = new Date(startDateStr);
  if (isNaN(startDate.getTime())) {
    throw new ApiError(400, 'Invalid date format');
  }

  const data = await lunationService.getUpcomingLunationEvents(startDate, months);
  sendSuccess(res, { data });
};

exports.getLunationByDate = async (req, res) => {
  const dateStr = req.params.date;
  const date = new Date(dateStr);
  
  if (isNaN(date.getTime())) {
    throw new ApiError(400, 'Invalid date format');
  }

  const data = await lunationService.getLunationForDate(date);
  sendSuccess(res, { data });
};
