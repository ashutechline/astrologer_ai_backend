const { getMonthlyEphemeris } = require('../services/ephemeris/ephemerisService');
const { sendSuccess } = require('../utils/apiResponse');
const ApiError = require('../utils/ApiError');

/** GET /ephemeris?month=M&year=Y */
async function getEphemeris(req, res) {
  const { month, year } = req.query;
  
  const m = parseInt(month, 10);
  const y = parseInt(year, 10);

  if (isNaN(m) || isNaN(y) || m < 1 || m > 12) {
    throw ApiError.badRequest('Valid month (1-12) and year are required.');
  }

  try {
    const data = await getMonthlyEphemeris(y, m);
    sendSuccess(res, { data });
  } catch (error) {
    throw ApiError.internal('Failed to calculate ephemeris: ' + error.message);
  }
}

module.exports = {
  getEphemeris,
};
