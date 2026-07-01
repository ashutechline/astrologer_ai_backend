const express = require('express');
const ctrl = require('../controllers/authController');
const validate = require('../middleware/validate');
const v = require('../validators/authValidators');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.post('/register', validate(v.register), ctrl.register);
router.post('/login', validate(v.login), ctrl.login);
router.post('/social-login', validate(v.socialLogin), ctrl.socialLogin);
router.post('/guest', validate(v.guestLogin), ctrl.guestLogin);
router.post('/refresh', validate(v.refresh), ctrl.refresh);
router.post('/logout-all', requireAuth, ctrl.logoutAll);

module.exports = router;
