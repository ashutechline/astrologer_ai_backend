const User = require('../models/User');
const { sendSuccess } = require('../utils/apiResponse');

/** GET /users/me */
async function getMe(req, res) {
  sendSuccess(res, { data: req.user.toPublicJSON() });
}

/** PATCH /users/me */
async function updateMe(req, res) {
  const allowed = ['name', 'gender', 'avatarUrl', 'locale', 'preferences', 'defaultChartId'];
  for (const key of allowed) {
    if (req.body[key] !== undefined) {
      if (key === 'preferences') {
        req.user.preferences = { ...req.user.preferences.toObject(), ...req.body.preferences };
      } else {
        req.user[key] = req.body[key];
      }
    }
  }
  await req.user.save();
  sendSuccess(res, { data: req.user.toPublicJSON() });
}

/** DELETE /users/me */
async function deleteMe(req, res) {
  await req.user.deleteOne();
  // Note: in production, cascade-delete or anonymize the user's charts, posts, journal entries, etc.
  // via a background job rather than inline here, to keep this request fast.
  sendSuccess(res, { data: { deleted: true } });
}

/** GET /users/me/export */
async function exportMe(req, res) {
  // Minimal GDPR-style export — extend with charts/journal/posts as needed
  sendSuccess(res, {
    data: {
      profile: req.user.toPublicJSON(),
      exportedAt: new Date().toISOString(),
    },
  });
}

/** POST /notifications/register-token */
async function registerFcmToken(req, res) {
  const { token } = req.body;
  await User.findByIdAndUpdate(req.userId, { $addToSet: { fcmTokens: token } });
  sendSuccess(res, { data: { registered: true } });
}

/** POST /users/me/complete-profile */
async function completeProfile(req, res) {
  req.user.isProfileComplete = true;
  await req.user.save();
  sendSuccess(res, { data: req.user.toPublicJSON() });
}

module.exports = { getMe, updateMe, deleteMe, exportMe, registerFcmToken, completeProfile };
