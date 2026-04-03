const multer = require('multer');
const path = require('path');

// Storage configuration for different file types
const createStorage = (destination) => {
  return multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, path.join(__dirname, '../uploads', destination));
    },
    filename: (req, file, cb) => {
      // Generate unique filename with timestamp
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const extension = path.extname(file.originalname);
      const basename = path.basename(file.originalname, extension);
      cb(null, `${basename}-${uniqueSuffix}${extension}`);
    }
  });
};

// File filter functions
const imageFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'), false);
  }
};

const videoFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('video/')) {
    cb(null, true);
  } else {
    cb(new Error('Only video files are allowed!'), false);
  }
};

const documentFilter = (req, file, cb) => {
  const allowedMimes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain'
  ];

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only document files (PDF, DOC, DOCX, TXT) are allowed!'), false);
  }
};

const generalFileFilter = (req, file, cb) => {
  // Allow all file types but limit size
  cb(null, true);
};

// Multer configurations for different use cases

// Profile/avatar upload
const uploadAvatar = multer({
  storage: createStorage('avatars'),
  fileFilter: imageFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
    files: 1
  }
});

// Exercise images upload
const uploadExerciseImages = multer({
  storage: createStorage('exercises/images'),
  fileFilter: imageFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB per file
    files: 5 // Max 5 images per exercise
  }
});

// Exercise videos upload
const uploadExerciseVideos = multer({
  storage: createStorage('exercises/videos'),
  fileFilter: videoFilter,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB per video
    files: 3 // Max 3 videos per exercise
  }
});

// Course materials upload
const uploadCourseMaterials = multer({
  storage: createStorage('courses'),
  fileFilter: generalFileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB per file
    files: 10 // Max 10 files per upload
  }
});

// Tip images upload
const uploadTipImages = multer({
  storage: createStorage('tips'),
  fileFilter: imageFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB per file
    files: 5 // Max 5 images per tip
  }
});

// Tip media upload (images and videos)
const uploadTipMedia = multer({
  storage: createStorage('tips'),
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image and video files are allowed!'), false);
    }
  },
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB per file
    files: 5 // Max 5 media files per tip
  }
});

// Progress photos upload
const uploadProgressPhotos = multer({
  storage: createStorage('progress'),
  fileFilter: imageFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB per file
    files: 4 // Max 4 photos (front, side, back, progress)
  }
});

// Message attachments upload
const uploadMessageAttachments = multer({
  storage: createStorage('messages'),
  fileFilter: generalFileFilter,
  limits: {
    fileSize: 25 * 1024 * 1024, // 25MB per file
    files: 5 // Max 5 attachments per message
  }
});

// General file upload (for mixed content)
const uploadGeneral = multer({
  storage: createStorage('general'),
  fileFilter: generalFileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB
    files: 10
  }
});

// Error handling middleware for multer
const handleMulterError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File too large'
      });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: 'Too many files'
      });
    }
    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        success: false,
        message: 'Unexpected file field'
      });
    }
  }

  if (error.message.includes('Only')) {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }

  next(error);
};

module.exports = {
  uploadAvatar,
  uploadExerciseImages,
  uploadExerciseVideos,
  uploadCourseMaterials,
  uploadTipImages,
  uploadTipMedia,
  uploadProgressPhotos,
  uploadMessageAttachments,
  uploadGeneral,
  handleMulterError
};