const express = require('express');
const ctrl = require('../controllers/aiChatController');
const validate = require('../middleware/validate');
const v = require('../validators/aiChatValidators');
const { requireAuth, loadUser } = require('../middleware/auth');

const router = express.Router();

router.use(requireAuth, loadUser);

router.post('/chat', validate(v.sendMessage), ctrl.chatStream);
router.get('/chat/history', validate(v.historyQuery), ctrl.getHistory);
router.get('/quota', ctrl.getQuota);
router.post('/chat/:messageId/bookmark', validate(v.bookmarkParam), ctrl.toggleBookmark);
router.post('/tutor', validate(v.tutorMessage), ctrl.tutorStream);

module.exports = router;
