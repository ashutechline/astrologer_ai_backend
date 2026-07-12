const express = require('express');
const ctrl = require('../controllers/userController');
const validate = require('../middleware/validate');
const v = require('../validators/userValidators');
const { requireAuth, loadUser } = require('../middleware/auth');

const router = express.Router();

router.use(requireAuth, loadUser);

router.get('/me', ctrl.getMe);
router.patch('/me', validate(v.updateMe), ctrl.updateMe);
router.delete('/me', ctrl.deleteMe);
router.get('/me/export', ctrl.exportMe);
router.post('/me/complete-profile', ctrl.completeProfile);

module.exports = router;
