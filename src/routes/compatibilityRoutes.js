const express = require('express');
const ctrl = require('../controllers/compatibilityController');
const validate = require('../middleware/validate');
const v = require('../validators/compatibilityValidators');
const { requireAuth, loadUser, requirePro } = require('../middleware/auth');

const router = express.Router();

// Invite-link resolution/submission is used by the PARTNER, who may not have an account —
// these two stay public (no requireAuth), gated only by a valid, unexpired token.
router.get('/invite/:token', validate(v.inviteTokenParam), ctrl.resolveInviteLink);
router.post('/invite/:token/submit', validate(v.submitInvite), ctrl.submitInviteLink);

// Everything else requires the inviting/comparing user to be authenticated and Pro
router.use(requireAuth, loadUser, requirePro);

router.post('/synastry', validate(v.createSynastry), ctrl.createSynastry);
router.get('/:synastryId', validate(v.synastryIdParam), ctrl.getSynastry);
router.post('/composite', validate(v.createComposite), ctrl.createComposite);
router.post('/invite-link', validate(v.createInvite), ctrl.createInviteLink);

module.exports = router;
