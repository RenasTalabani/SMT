const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { protect, requireApproval } = require('../middlewares/auth');

const router = express.Router();

// ── Cloudinary check ─────────────────────────────────────────────────────────
const cloudinaryConfigured =
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET;

let cloudinary = null;
if (cloudinaryConfigured) {
  cloudinary = require('cloudinary').v2;
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
  console.log('Upload: using Cloudinary storage');
} else {
  console.log('Upload: Cloudinary not configured — using local disk storage');
}

// ── Local disk storage ────────────────────────────────────────────────────────
function localStorage(subdir) {
  return multer.diskStorage({
    destination: (req, file, cb) => {
      const dir = path.join(__dirname, `../uploads/${subdir}`);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      cb(null, dir);
    },
    filename: (req, file, cb) => {
      const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
      cb(null, `${subdir.slice(0, 3)}-${unique}${path.extname(file.originalname)}`);
    }
  });
}

const videoFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('video/')) cb(null, true);
  else cb(new Error('Only video files are allowed'), false);
};

const imageFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) cb(null, true);
  else cb(new Error('Only image files are allowed'), false);
};

// Use memory storage when Cloudinary is active so we can stream to cloud
const videoUpload = multer({
  storage: cloudinaryConfigured ? multer.memoryStorage() : localStorage('videos'),
  fileFilter: videoFilter,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100 MB
});

const imageUpload = multer({
  storage: cloudinaryConfigured ? multer.memoryStorage() : localStorage('images'),
  fileFilter: imageFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
});

// ── Helper: upload buffer to Cloudinary ────────────────────────────────────────
function uploadToCloudinary(buffer, folder, resourceType) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: resourceType },
      (error, result) => (error ? reject(error) : resolve(result))
    );
    const { Readable } = require('stream');
    const readable = new Readable();
    readable.push(buffer);
    readable.push(null);
    readable.pipe(stream);
  });
}

// ── POST /api/upload/video ─────────────────────────────────────────────────────
router.post('/video', protect, requireApproval, (req, res) => {
  videoUpload.single('video')(req, res, async (err) => {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({ success: false, message: err.code === 'LIMIT_FILE_SIZE' ? 'Video too large (max 100 MB)' : err.message });
    }
    if (err) return res.status(400).json({ success: false, message: err.message });
    if (!req.file) return res.status(400).json({ success: false, message: 'No video file provided' });

    try {
      let url;
      if (cloudinaryConfigured) {
        const result = await uploadToCloudinary(req.file.buffer, 'citygym/videos', 'video');
        url = result.secure_url;
      } else {
        url = `${req.protocol}://${req.get('host')}/uploads/videos/${req.file.filename}`;
      }

      res.json({
        success: true,
        data: { url, size: req.file.size, mimetype: req.file.mimetype },
        message: 'Video uploaded successfully'
      });
    } catch (uploadErr) {
      console.error('Cloudinary video upload error:', uploadErr.message);
      res.status(500).json({ success: false, message: 'Upload failed. Try again.' });
    }
  });
});

// ── POST /api/upload/image ─────────────────────────────────────────────────────
router.post('/image', protect, (req, res) => {
  imageUpload.single('image')(req, res, async (err) => {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({ success: false, message: err.code === 'LIMIT_FILE_SIZE' ? 'Image too large (max 10 MB)' : err.message });
    }
    if (err) return res.status(400).json({ success: false, message: err.message });
    if (!req.file) return res.status(400).json({ success: false, message: 'No image file provided' });

    try {
      let url;
      if (cloudinaryConfigured) {
        const result = await uploadToCloudinary(req.file.buffer, 'citygym/images', 'image');
        url = result.secure_url;
      } else {
        url = `${req.protocol}://${req.get('host')}/uploads/images/${req.file.filename}`;
      }

      res.json({
        success: true,
        data: { url, size: req.file.size },
        message: 'Image uploaded successfully'
      });
    } catch (uploadErr) {
      console.error('Cloudinary image upload error:', uploadErr.message);
      res.status(500).json({ success: false, message: 'Upload failed. Try again.' });
    }
  });
});

module.exports = router;
