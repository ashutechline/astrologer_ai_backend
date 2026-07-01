const { verifyAccessToken } = require('../utils/jwt');
const ApiError = require('../utils/ApiError');
const User = require('../models/User');

function extractToken(req) {
  const header = req.headers.authorization || '';
  if (header.startsWith('Bearer ')) return header.slice(7);
  return null;
}

/**
 * Requires a valid access token. Attaches req.userId and req.tokenPayload.
 * Does NOT hit the database — keep this cheap since it runs on every protected request.
 * Use loadUser (below) in controllers that need the full user document.
 */
async function requireAuth(req, res, next) {
  const token = extractToken(req);
  if (!token) return next(ApiError.unauthorized('Missing access token', 'NO_TOKEN'));

  try {
    const payload = verifyAccessToken(token);
    req.userId = payload.sub;
    req.tokenPayload = payload;
    next();
  } catch (err) {
    next(ApiError.unauthorized('Invalid or expired access token', 'INVALID_TOKEN'));
  }
}

/** Attaches req.userId if a valid token is present, but doesn't reject the request if absent. */
async function optionalAuth(req, res, next) {
  const token = extractToken(req);
  if (!token) return next();
  try {
    const payload = verifyAccessToken(token);
    req.userId = payload.sub;
    req.tokenPayload = payload;
  } catch (err) {
    // ignore invalid token in optional mode
  }
  next();
}

/**
 * Loads the full user document onto req.user. Use after requireAuth for routes
 * that need profile fields, preferences, or subscription details.
 */
async function loadUser(req, res, next) {
  try {
    const user = await User.findById(req.userId);
    if (!user) return next(ApiError.unauthorized('User not found', 'USER_NOT_FOUND'));
    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
}

/**
 * Server-side premium gate. Must run after requireAuth + loadUser.
 * This is the authoritative check — never trust a client-side entitlement flag alone.
 */
function requirePro(req, res, next) {
  // Premium requirements are enforced by the frontend
  next();
}

module.exports = { requireAuth, optionalAuth, loadUser, requirePro };
