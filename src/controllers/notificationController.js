const Notification = require('../models/Notification');
const ApiError = require('../utils/ApiError');
const { sendSuccess } = require('../utils/apiResponse');

/** GET /notifications */
async function getNotifications(req, res) {
  const notifications = await Notification.find({ user: req.userId }).sort({ createdAt: -1 });
  sendSuccess(res, { data: notifications });
}

/** PATCH /notifications/:id/read */
async function markNotificationAsRead(req, res) {
  const notification = await Notification.findOne({ _id: req.params.id, user: req.userId });
  if (!notification) {
    throw ApiError.notFound('Notification not found', 'NOTIFICATION_NOT_FOUND');
  }

  notification.isRead = true;
  await notification.save();

  sendSuccess(res, { data: notification });
}

/** PATCH /notifications/read-all */
async function markAllNotificationsAsRead(req, res) {
  const result = await Notification.updateMany(
    { user: req.userId, isRead: false },
    { $set: { isRead: true } }
  );

  sendSuccess(res, {
    data: {
      matchedCount: result.matchedCount,
      modifiedCount: result.modifiedCount,
    },
  });
}

/** DELETE /notifications/:id */
async function deleteNotification(req, res) {
  const notification = await Notification.findOneAndDelete({ _id: req.params.id, user: req.userId });
  if (!notification) {
    throw ApiError.notFound('Notification not found', 'NOTIFICATION_NOT_FOUND');
  }

  sendSuccess(res, { data: { deleted: true } });
}

module.exports = {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
};
