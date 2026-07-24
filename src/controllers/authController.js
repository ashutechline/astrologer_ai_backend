const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const { sendSuccess } = require('../utils/apiResponse');
const { signAccessToken, signRefreshToken, verifyRefreshToken } = require('../utils/jwt');
const { verifyGoogleToken, verifyAppleToken } = require('../services/socialAuthService');

function issueTokenPair(user) {
  return { accessToken: signAccessToken(user), refreshToken: signRefreshToken(user) };
}

/** POST /auth/register */
async function register(req, res) {
  const { name, email, password, locale } = req.body;

  const existing = await User.findOne({ email });
  if (existing) throw ApiError.conflict('An account with this email already exists', 'EMAIL_TAKEN');

  const user = await User.create({ name, email, passwordHash: password, locale });
  const tokens = issueTokenPair(user);

  sendSuccess(res, { statusCode: 201, data: { user: user.toPublicJSON(), ...tokens } });
}

/** POST /auth/login */
async function login(req, res) {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select('+passwordHash');
  if (!user) throw ApiError.unauthorized('Invalid email or password', 'INVALID_CREDENTIALS');

  const matches = await user.comparePassword(password);
  if (!matches) throw ApiError.unauthorized('Invalid email or password', 'INVALID_CREDENTIALS');

  const tokens = issueTokenPair(user);
  sendSuccess(res, { data: { user: user.toPublicJSON(), ...tokens } });
}

/** POST /auth/social-login */
async function socialLogin(req, res) {
  const { provider, idToken, name } = req.body;

  let profile;
  if (provider === 'google') {
    profile = await verifyGoogleToken(idToken);
  } else {
    profile = await verifyAppleToken(idToken);
  }

  const idField = provider === 'google' ? 'googleId' : 'appleId';
  let user = await User.findOne({ [idField]: profile.providerId });

  if (!user && profile.email) {
    // Link to an existing email/password account if one exists with the same email
    user = await User.findOne({ email: profile.email });
  }

  if (!user) {
    user = await User.create({
      name: profile.name || name || 'Cosmic Explorer',
      email: profile.email || undefined,
      [idField]: profile.providerId,
    });
  } else if (!user[idField]) {
    user[idField] = profile.providerId;
    await user.save();
  }

  const tokens = issueTokenPair(user);
  sendSuccess(res, { data: { user: user.toPublicJSON(), ...tokens } });
}

/** POST /auth/guest */
async function guestLogin(req, res) {
  const { name } = req.body;
  const guestEmail = `guest_${Date.now()}_${Math.random().toString(36).substring(2, 8)}@guest.local`;
  const user = await User.create({ name, email: guestEmail, isGuest: true });
  const tokens = issueTokenPair(user);
  sendSuccess(res, { statusCode: 201, data: { user: user.toPublicJSON(), ...tokens } });
}

/** POST /auth/refresh */
async function refresh(req, res) {
  const { refreshToken } = req.body;

  let payload;
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch (err) {
    throw ApiError.unauthorized('Invalid or expired refresh token', 'INVALID_REFRESH_TOKEN');
  }

  const user = await User.findById(payload.sub);
  if (!user || user.refreshTokenVersion !== payload.v) {
    throw ApiError.unauthorized('Refresh token has been revoked', 'REFRESH_TOKEN_REVOKED');
  }

  const tokens = issueTokenPair(user);
  sendSuccess(res, { data: tokens });
}

/** POST /auth/logout-all — bumps refreshTokenVersion to invalidate all outstanding refresh tokens */
async function logoutAll(req, res) {
  await User.findByIdAndUpdate(req.userId, { $inc: { refreshTokenVersion: 1 } });
  sendSuccess(res, { data: { loggedOut: true } });
}

module.exports = { register, login, socialLogin, guestLogin, refresh, logoutAll };
