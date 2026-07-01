const express = require('express');
const userCtrl = require('../controllers/userController');
const validate = require('../middleware/validate');
const userValidators = require('../validators/userValidators');
const { requireAuth, loadUser } = require('../middleware/auth');

/**
 * The Settings screen (Account / Preferences / Appearance / Notifications / Privacy / About)
 * is backed by the same User document as the Profile screen — there's no separate Settings
 * model. This router exists as a clearly-named, discoverable mount point (`/settings/...`)
 * that delegates to userController, so the API surface matches how the app's IA is organized
 * even though the underlying data lives in one place.
 */
const router = express.Router();

router.use(requireAuth, loadUser);

router.get('/', userCtrl.getMe); // full settings payload is just the user's profile + preferences
router.patch('/', validate(userValidators.updateMe), userCtrl.updateMe);
router.delete('/account', userCtrl.deleteMe); // Settings → Privacy → Delete account
router.get('/data-export', userCtrl.exportMe); // Settings → Privacy → Export data

module.exports = router;
