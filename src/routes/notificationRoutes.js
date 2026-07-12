const express = require('express');
const userCtrl = require('../controllers/userController');
const notificationCtrl = require('../controllers/notificationController');
const validate = require('../middleware/validate');
const userV = require('../validators/userValidators');
const notificationV = require('../validators/notificationValidators');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// Existing token registration
router.post('/notifications/register-token', requireAuth, validate(userV.registerFcmToken), userCtrl.registerFcmToken);

// New inbox routes
router.get('/notifications', requireAuth, notificationCtrl.getNotifications);
router.patch('/notifications/read-all', requireAuth, notificationCtrl.markAllNotificationsAsRead);
router.patch('/notifications/:id/read', requireAuth, validate(notificationV.idParam), notificationCtrl.markNotificationAsRead);
router.delete('/delete-notifications/:id', requireAuth, validate(notificationV.idParam), notificationCtrl.deleteNotification);

module.exports = router;
