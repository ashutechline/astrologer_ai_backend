const Joi = require('joi');

const objectId = Joi.string().hex().length(24);

const createChart = {
  body: Joi.object({
    label: Joi.string().trim().max(80).required(),
    birthDate: Joi.string().pattern(/^(18|19|20|21|22|23)\d{2}-\d{2}-\d{2}$/).message('birthDate year must be between 1800 and 2399').required(),
    birthTime: Joi.string().pattern(/^\d{2}:\d{2}$/).allow(null),
    timeUnknown: Joi.boolean().default(false),
    birthPlace: Joi.object({
      placeName: Joi.string().required(),
      latitude: Joi.number().min(-90).max(90).required(),
      longitude: Joi.number().min(-180).max(180).required(),
      utcOffsetMinutes: Joi.number().min(-720).max(840).required(),
    }).required(),
    houseSystem: Joi.string().valid('placidus', 'whole_sign', 'koch', 'equal').default('placidus'),
    zodiacSystem: Joi.string().valid('western', 'vedic', 'chinese').default('western'),
    isPrimary: Joi.boolean().default(false),
  }),
};

const updateChart = {
  params: Joi.object({ chartId: objectId.required() }),
  body: Joi.object({
    label: Joi.string().trim().max(80),
    birthDate: Joi.string().pattern(/^(18|19|20|21|22|23)\d{2}-\d{2}-\d{2}$/).message('birthDate year must be between 1800 and 2399'),
    birthTime: Joi.string().pattern(/^\d{2}:\d{2}$/).allow(null),
    timeUnknown: Joi.boolean(),
    birthPlace: Joi.object({
      placeName: Joi.string(),
      latitude: Joi.number().min(-90).max(90),
      longitude: Joi.number().min(-180).max(180),
      utcOffsetMinutes: Joi.number().min(-720).max(840),
    }),
    houseSystem: Joi.string().valid('placidus', 'whole_sign', 'koch', 'equal'),
    zodiacSystem: Joi.string().valid('western', 'vedic', 'chinese'),
  }).min(1),
};

const chartIdParam = {
  params: Joi.object({ chartId: objectId.required() }),
};

module.exports = { createChart, updateChart, chartIdParam };
