const { find } = require('geo-tz');
const moment = require('moment-timezone');
const City = require('../models/City');

const searchCities = async (req, res) => {
  const { name } = req.query;

  if (!name) {
    return res.status(400).json({ error: 'City name query parameter is required' });
  }

  // Use a case-insensitive regular expression for searching
  const regex = new RegExp(name, 'i');
  
  // Find matching cities, limit to 20 to avoid large payloads
  const cities = await City.find({ city: regex }).limit(20);

  // Enrich results with TimeZone ID and UTC Offset
  // Using today's date for standard offset, can be dynamic if date is provided
  const now = new Date();

  const enrichedCities = cities.map((city) => {
    // 1. Get timezone ID using geo-tz
    const timezones = find(city.lat, city.lng);
    const timeZoneId = timezones && timezones.length > 0 ? timezones[0] : 'UTC';

    // 2. Get exact UTC offset in minutes using moment-timezone
    const utcOffsetMinutes = moment.tz(now, timeZoneId).utcOffset();

    return {
      _id: city._id,
      city: city.city,
      admin_name: city.admin_name,
      lat: city.lat,
      lng: city.lng,
      country: city.country,
      timeZoneId,
      utcOffsetMinutes
    };
  });

  return res.status(200).json({
    success: true,
    count: enrichedCities.length,
    data: enrichedCities
  });
};

module.exports = {
  searchCities
};
