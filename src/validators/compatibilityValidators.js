const Joi = require('joi');

const objectId = Joi.string().hex().length(24);
const modeEnum = Joi.string().valid('romantic', 'friendship', 'professional');

const birthDataSchema = Joi.object({
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
});

const createSynastry = {
  body: Joi.object({
    chartIdA: objectId.required(),
    chartIdB: objectId,
    partnerBirthData: birthDataSchema,
    mode: modeEnum.default('romantic'),
  }).xor('chartIdB', 'partnerBirthData'),
};

const synastryIdParam = {
  params: Joi.object({ synastryId: objectId.required() }),
};

const createComposite = {
  body: Joi.object({ chartIdA: objectId.required(), chartIdB: objectId.required() }),
};

const createInvite = {
  body: Joi.object({ chartId: objectId.required(), mode: modeEnum.default('romantic') }),
};

const inviteTokenParam = {
  params: Joi.object({ token: Joi.string().required() }),
};

const submitInvite = {
  params: Joi.object({ token: Joi.string().required() }),
  body: birthDataSchema,
};

module.exports = {
  createSynastry,
  synastryIdParam,
  createComposite,
  createInvite,
  inviteTokenParam,
  submitInvite,
};
