/**
 * Wraps every successful response in a consistent envelope:
 * { success: true, data: ..., meta?: ... }
 */
function sendSuccess(res, { statusCode = 200, data = null, meta = undefined, message = undefined }) {
  const body = { success: true };
  if (message) body.message = message;
  if (data !== null) body.data = data;
  if (meta) body.meta = meta;
  return res.status(statusCode).json(body);
}

module.exports = { sendSuccess };
