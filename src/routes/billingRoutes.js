const express = require('express');
const ctrl = require('../controllers/billingController');
const { requireAuth, loadUser } = require('../middleware/auth');

const router = express.Router();

// Webhook is unauthenticated (verified via shared secret header instead, see controller)
router.post('/webhooks/revenuecat', ctrl.revenueCatWebhook);

router.get('/entitlements', requireAuth, loadUser, ctrl.getEntitlements);

module.exports = router;
