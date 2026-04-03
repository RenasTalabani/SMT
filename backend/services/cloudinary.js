const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const path = require('path');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Upload file to Cloudinary
const uploadToCloudinary = async (filePath, options = {}) => {
  try {
    const result = await cloudinary.uploader.upload(filePath, {
      folder: options.folder || 'gym_app',
      public_id: options.publicId,
      transformation: options.transformation || [],
      resource_type: options.resourceType || 'auto',
      ...options
    });

    // Delete local file after upload
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    return {
      publicId: result.public_id,
      url: result.secure_url,
      format: result.format,
      width: result.width,
      height: result.height,
      bytes: result.bytes,
      createdAt: result.created_at
    };
  } catch (error) {
    // Clean up local file on error
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    throw error;
  }
};

// Upload multiple files
const uploadMultipleToCloudinary = async (filePaths, options = {}) => {
  const uploadPromises = filePaths.map(filePath => uploadToCloudinary(filePath, options));
  return Promise.all(uploadPromises);
};

// Delete file from Cloudinary
const deleteFromCloudinary = async (publicId, resourceType = 'image') => {
  try {
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType
    });
    return result;
  } catch (error) {
    console.error('Cloudinary delete error:', error);
    throw error;
  }
};

// Delete multiple files
const deleteMultipleFromCloudinary = async (publicIds, resourceType = 'image') => {
  const deletePromises = publicIds.map(publicId => deleteFromCloudinary(publicId, resourceType));
  return Promise.all(deletePromises);
};

// Upload avatar with specific transformations
const uploadAvatar = async (filePath, userId) => {
  return uploadToCloudinary(filePath, {
    folder: 'gym_app/avatars',
    publicId: `avatar_${userId}_${Date.now()}`,
    transformation: [
      { width: 300, height: 300, crop: 'fill', gravity: 'face' },
      { quality: 'auto' }
    ]
  });
};

// Upload exercise image
const uploadExerciseImage = async (filePath, exerciseId) => {
  return uploadToCloudinary(filePath, {
    folder: 'gym_app/exercises/images',
    publicId: `exercise_${exerciseId}_${Date.now()}`,
    transformation: [
      { width: 800, height: 600, crop: 'limit' },
      { quality: 'auto' }
    ]
  });
};

// Upload exercise video
const uploadExerciseVideo = async (filePath, exerciseId) => {
  return uploadToCloudinary(filePath, {
    folder: 'gym_app/exercises/videos',
    publicId: `exercise_video_${exerciseId}_${Date.now()}`,
    resourceType: 'video',
    transformation: [
      { quality: 'auto' },
      { video_codec: 'auto' }
    ]
  });
};

// Upload course thumbnail
const uploadCourseThumbnail = async (filePath, courseId) => {
  return uploadToCloudinary(filePath, {
    folder: 'gym_app/courses/thumbnails',
    publicId: `course_thumb_${courseId}_${Date.now()}`,
    transformation: [
      { width: 640, height: 360, crop: 'fill' },
      { quality: 'auto' }
    ]
  });
};

// Upload course video
const uploadCourseVideo = async (filePath, courseId, weekNumber) => {
  return uploadToCloudinary(filePath, {
    folder: 'gym_app/courses/videos',
    publicId: `course_${courseId}_week${weekNumber}_${Date.now()}`,
    resourceType: 'video',
    transformation: [
      { quality: 'auto' },
      { video_codec: 'auto' }
    ]
  });
};

// Upload tip image
const uploadTipImage = async (filePath, tipId) => {
  return uploadToCloudinary(filePath, {
    folder: 'gym_app/tips/images',
    publicId: `tip_${tipId}_${Date.now()}`,
    transformation: [
      { width: 800, height: 600, crop: 'limit' },
      { quality: 'auto' }
    ]
  });
};

// Upload progress photo
const uploadProgressPhoto = async (filePath, userId, type = 'progress') => {
  return uploadToCloudinary(filePath, {
    folder: 'gym_app/progress',
    publicId: `progress_${userId}_${type}_${Date.now()}`,
    transformation: [
      { width: 600, height: 800, crop: 'limit' },
      { quality: 'auto' }
    ]
  });
};

// Upload message attachment
const uploadMessageAttachment = async (filePath, messageId, filename) => {
  const extension = path.extname(filename).toLowerCase();
  let resourceType = 'raw'; // default for documents

  if (['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(extension)) {
    resourceType = 'image';
  } else if (['.mp4', '.avi', '.mov', '.wmv'].includes(extension)) {
    resourceType = 'video';
  }

  return uploadToCloudinary(filePath, {
    folder: 'gym_app/messages',
    publicId: `message_${messageId}_${Date.now()}`,
    resourceType
  });
};

// Get optimized URL with transformations
const getOptimizedUrl = (publicId, options = {}) => {
  return cloudinary.url(publicId, {
    quality: 'auto',
    format: 'auto',
    ...options
  });
};

// Get thumbnail URL
const getThumbnailUrl = (publicId, width = 150, height = 150) => {
  return cloudinary.url(publicId, {
    width,
    height,
    crop: 'fill',
    quality: 'auto',
    format: 'auto'
  });
};

// Generate video thumbnail
const generateVideoThumbnail = async (publicId, time = 5) => {
  try {
    const result = await cloudinary.uploader.generate_sprite(publicId, {
      transformation: [
        { width: 200, height: 200, crop: 'crop' },
        { quality: 'auto' }
      ]
    });
    return result;
  } catch (error) {
    console.error('Video thumbnail generation error:', error);
    throw error;
  }
};

module.exports = {
  uploadToCloudinary,
  uploadMultipleToCloudinary,
  deleteFromCloudinary,
  deleteMultipleFromCloudinary,
  uploadAvatar,
  uploadExerciseImage,
  uploadExerciseVideo,
  uploadCourseThumbnail,
  uploadCourseVideo,
  uploadTipImage,
  uploadProgressPhoto,
  uploadMessageAttachment,
  getOptimizedUrl,
  getThumbnailUrl,
  generateVideoThumbnail
};