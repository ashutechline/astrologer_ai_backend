const { OAuth2Client } = require('google-auth-library');
const appleSignin = require('apple-signin-auth');
const config = require('../config/env');
const ApiError = require('../utils/ApiError');

const googleClient = new OAuth2Client(config.social.googleClientId);

/** Verifies a Google ID token and returns { providerId, email, name }. */
async function verifyGoogleToken(idToken) {
  try {
    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: config.social.googleClientId,
    });
    const payload = ticket.getPayload();
    return { providerId: payload.sub, email: payload.email, name: payload.name };
  } catch (err) {
    throw ApiError.unauthorized('Invalid Google token', 'INVALID_SOCIAL_TOKEN');
  }
}

/** Verifies an Apple identity token and returns { providerId, email }. Apple doesn't return name in the token. */
async function verifyAppleToken(idToken) {
  try {
    const payload = await appleSignin.verifyIdToken(idToken, {
      audience: config.social.appleClientId,
      ignoreExpiration: false,
    });
    return { providerId: payload.sub, email: payload.email };
  } catch (err) {
    throw ApiError.unauthorized('Invalid Apple token', 'INVALID_SOCIAL_TOKEN');
  }
}

module.exports = { verifyGoogleToken, verifyAppleToken };
