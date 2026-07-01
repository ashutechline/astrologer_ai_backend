const express = require('express');
const ctrl = require('../controllers/userController');
const validate = require('../middleware/validate');
const v = require('../validators/userValidators');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.post('/register-token', requireAuth, validate(v.registerFcmToken), ctrl.registerFcmToken);

module.exports = router;
