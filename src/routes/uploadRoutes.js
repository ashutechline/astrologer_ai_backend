const express = require('express');
const multer = require('multer');
const { uploadFile } = require('../controllers/uploadController');

const router = express.Router();
const storage = multer.memoryStorage();
// 5MB limit for example, and allow only images
const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only images are allowed'));
    }
  }
});

// The user requested the endpoint to be /upload-file
router.post('/upload-file', upload.single('file'), uploadFile);

module.exports = router;
