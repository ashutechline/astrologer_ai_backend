const Joi = require('joi');

const register = {
  body: Joi.object({
    name: Joi.string().trim().min(1).max(80).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(8).max(128).required(),
    locale: Joi.string().max(10).default('en'),
  }),
};

const login = {
  body: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
  }),
};

const socialLogin = {
  body: Joi.object({
    provider: Joi.string().valid('google', 'apple').required(),
    idToken: Joi.string().required(),
    name: Joi.string().max(80).optional(), // Apple sometimes only gives a name on first login
  }),
};

const guestLogin = {
  body: Joi.object({
    name: Joi.string().trim().max(80).default('Guest'),
  }),
};

const refresh = {
  body: Joi.object({
    refreshToken: Joi.string().required(),
  }),
};

module.exports = { register, login, socialLogin, guestLogin, refresh };
