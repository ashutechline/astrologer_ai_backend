const cloudinary = require('cloudinary').v2;
const config = require('../config/env');
const logger = require('../config/logger');

if (!config.cloudinary.cloudName || !config.cloudinary.apiKey || !config.cloudinary.apiSecret) {
  logger.warn('Cloudinary credentials not fully configured — uploads will fail');
}

cloudinary.config({
  cloud_name: config.cloudinary.cloudName,
  api_key: config.cloudinary.apiKey,
  api_secret: config.cloudinary.apiSecret,
});

module.exports = cloudinary;
