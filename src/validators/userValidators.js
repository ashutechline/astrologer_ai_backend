const Joi = require('joi');

const updateMe = {
  body: Joi.object({
    name: Joi.string().trim().max(80),
    gender: Joi.string().valid('male', 'female', 'nonbinary', 'unspecified'),
    avatarUrl: Joi.string().uri().allow(null),
    locale: Joi.string().max(10),
    defaultChartId: Joi.string().hex().length(24),
    preferences: Joi.object({
      zodiacSystem: Joi.string().valid('western', 'vedic', 'chinese'),
      houseSystem: Joi.string().valid('placidus', 'whole_sign', 'koch', 'equal'),
      theme: Joi.string().valid('light', 'dark', 'cosmic'),
      dateFormat: Joi.string(),
      notifications: Joi.object({
        dailyHoroscope: Joi.boolean(),
        moonAlerts: Joi.boolean(),
        retrogradeWarnings: Joi.boolean(),
        communityActivity: Joi.boolean(),
      }),
    }),
  }).min(1),
};

const registerFcmToken = {
  body: Joi.object({ token: Joi.string().required() }),
};

module.exports = { updateMe, registerFcmToken };
