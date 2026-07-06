const cloudinary = require('../services/cloudinaryService');
const Upload = require('../models/Upload');
const logger = require('../config/logger');

/**
 * @desc    Upload an image file to Cloudinary and store the URL in the database
 * @route   POST /v1/upload-file
 * @access  Public (or update with auth middleware if needed)
 */
const uploadFile = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file provided' });
  }

  try {
    // We use a Promise to handle the stream upload to Cloudinary
    const streamUpload = (req) => {
      return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: 'cosmic-ai' },
          (error, result) => {
            if (result) {
              resolve(result);
            } else {
              reject(error);
            }
          }
        );
        stream.end(req.file.buffer);
      });
    };

    const result = await streamUpload(req);

    // Save to Database
    const newUpload = await Upload.create({
      url: result.secure_url,
      publicId: result.public_id,
      format: result.format,
      resourceType: result.resource_type,
    });

    res.status(201).json({
      message: 'File uploaded successfully',
      data: newUpload,
    });
  } catch (error) {
    logger.error('Error uploading file to Cloudinary:', error);
    res.status(500).json({ error: 'Upload failed', details: error.message });
  }
};

module.exports = {
  uploadFile,
};
