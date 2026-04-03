const express = require('express');
const Tip = require('../models/Tip');
const { protect, authorize, requireApproval } = require('../middlewares/auth');
const {
  uploadTipMedia,
  handleMulterError
} = require('../middlewares/upload');
const {
  uploadTipImage,
  uploadTipVideo
} = require('../services/cloudinary');
const {
  validateTipCreation,
  validateObjectId,
  validatePagination
} = require('../middlewares/validation');

const router = express.Router();

// @route   GET /api/tips
// @desc    Get tips
// @access  Public
router.get('/', validatePagination, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const filter = { isPublished: true, isActive: true };

    if (req.query.category) filter.category = req.query.category;
    if (req.query.type) filter.type = req.query.type;
    if (req.query.author) filter.author = req.query.author;
    if (req.query.difficulty) filter.difficulty = req.query.difficulty;
    if (req.query.search) {
      filter.$or = [
        { title: { $regex: req.query.search, $options: 'i' } },
        { content: { $regex: req.query.search, $options: 'i' } },
        { tags: { $in: [new RegExp(req.query.search, 'i')] } }
      ];
    }

    const tips = await Tip.find(filter)
      .populate('author', 'name avatar specialization rating')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Tip.countDocuments(filter);

    res.json({
      success: true,
      data: {
        tips,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get tips error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/tips/categories
// @desc    Get tip categories
// @access  Public
router.get('/categories', async (req, res) => {
  try {
    const categories = await Tip.distinct('category', { isPublished: true, isActive: true });

    res.json({
      success: true,
      data: { categories }
    });
  } catch (error) {
    console.error('Get tip categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/tips/:id
// @desc    Get tip by ID
// @access  Public
router.get('/:id', validateObjectId, async (req, res) => {
  try {
    const tip = await Tip.findById(req.params.id)
      .populate('author', 'name avatar bio specialization certifications rating reviewCount');

    if (!tip || !tip.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Tip not found'
      });
    }

    // Don't show if not published
    if (!tip.isPublished) {
      return res.status(404).json({
        success: false,
        message: 'Tip not found'
      });
    }

    // Increment view count
    tip.views += 1;
    await tip.save();

    res.json({
      success: true,
      data: { tip }
    });
  } catch (error) {
    console.error('Get tip error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/tips
// @desc    Create tip
// @access  Private/Coach
router.post('/', protect, requireApproval, validateTipCreation, async (req, res) => {
  try {
    const tipData = {
      ...req.body,
      author: req.user._id
    };

    const tip = await Tip.create(tipData);

    res.status(201).json({
      success: true,
      data: { tip },
      message: 'Tip created successfully'
    });
  } catch (error) {
    console.error('Create tip error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   PUT /api/tips/:id
// @desc    Update tip
// @access  Private/Coach/Admin
router.put('/:id', protect, validateObjectId, async (req, res) => {
  try {
    const tip = await Tip.findById(req.params.id);

    if (!tip) {
      return res.status(404).json({
        success: false,
        message: 'Tip not found'
      });
    }

    // Only author or admin can update
    if (req.user.role !== 'admin' && tip.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this tip'
      });
    }

    const allowedFields = [
      'title', 'titleAr', 'titleKu', 'content', 'contentAr', 'contentKu',
      'category', 'type', 'difficulty', 'estimatedTime', 'tags', 'media',
      'isPublished'
    ];

    const updates = {};
    Object.keys(req.body).forEach(key => {
      if (allowedFields.includes(key)) {
        updates[key] = req.body[key];
      }
    });

    const updatedTip = await Tip.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    ).populate('author', 'name avatar');

    res.json({
      success: true,
      data: { tip: updatedTip },
      message: 'Tip updated successfully'
    });
  } catch (error) {
    console.error('Update tip error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/tips/:id/media
// @desc    Upload tip media
// @access  Private/Coach/Admin
router.post('/:id/media', protect, validateObjectId, uploadTipMedia.array('media', 5), handleMulterError, async (req, res) => {
  try {
    const tip = await Tip.findById(req.params.id);

    if (!tip) {
      return res.status(404).json({
        success: false,
        message: 'Tip not found'
      });
    }

    // Only author or admin can upload
    if (req.user.role !== 'admin' && tip.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to upload media for this tip'
      });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No media files provided'
      });
    }

    const mediaUrls = [];

    for (const file of req.files) {
      let mediaData;
      if (file.mimetype.startsWith('image/')) {
        mediaData = await uploadTipImage(file.path, tip._id);
      } else if (file.mimetype.startsWith('video/')) {
        mediaData = await uploadTipVideo(file.path, tip._id);
      }

      if (mediaData) {
        mediaUrls.push({
          type: file.mimetype.startsWith('image/') ? 'image' : 'video',
          url: mediaData.url,
          publicId: mediaData.public_id
        });
      }
    }

    // Add to tip media array
    tip.media = [...(tip.media || []), ...mediaUrls];
    await tip.save();

    res.json({
      success: true,
      data: { media: tip.media },
      message: 'Media uploaded successfully'
    });
  } catch (error) {
    console.error('Upload tip media error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/tips/:id/like
// @desc    Like/unlike tip
// @access  Private
router.post('/:id/like', protect, validateObjectId, async (req, res) => {
  try {
    const tip = await Tip.findById(req.params.id);

    if (!tip) {
      return res.status(404).json({
        success: false,
        message: 'Tip not found'
      });
    }

    const userId = req.user._id.toString();
    const likeIndex = tip.likes.indexOf(userId);

    if (likeIndex > -1) {
      // Unlike
      tip.likes.splice(likeIndex, 1);
      tip.likesCount -= 1;
    } else {
      // Like
      tip.likes.push(userId);
      tip.likesCount += 1;
    }

    await tip.save();

    res.json({
      success: true,
      data: {
        liked: likeIndex === -1,
        likesCount: tip.likesCount
      }
    });
  } catch (error) {
    console.error('Like tip error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/tips/:id/bookmark
// @desc    Bookmark/unbookmark tip
// @access  Private
router.post('/:id/bookmark', protect, validateObjectId, async (req, res) => {
  try {
    const tip = await Tip.findById(req.params.id);

    if (!tip) {
      return res.status(404).json({
        success: false,
        message: 'Tip not found'
      });
    }

    const userId = req.user._id.toString();
    const bookmarkIndex = tip.bookmarks.indexOf(userId);

    if (bookmarkIndex > -1) {
      // Unbookmark
      tip.bookmarks.splice(bookmarkIndex, 1);
      tip.bookmarksCount -= 1;
    } else {
      // Bookmark
      tip.bookmarks.push(userId);
      tip.bookmarksCount += 1;
    }

    await tip.save();

    res.json({
      success: true,
      data: {
        bookmarked: bookmarkIndex === -1,
        bookmarksCount: tip.bookmarksCount
      }
    });
  } catch (error) {
    console.error('Bookmark tip error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/tips/:id/comments
// @desc    Get tip comments
// @access  Public
router.get('/:id/comments', validateObjectId, async (req, res) => {
  try {
    const tip = await Tip.findById(req.params.id)
      .populate('comments.author', 'name avatar')
      .select('comments');

    if (!tip) {
      return res.status(404).json({
        success: false,
        message: 'Tip not found'
      });
    }

    res.json({
      success: true,
      data: { comments: tip.comments }
    });
  } catch (error) {
    console.error('Get tip comments error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/tips/:id/comments
// @desc    Add comment to tip
// @access  Private
router.post('/:id/comments', protect, validateObjectId, async (req, res) => {
  try {
    const { content } = req.body;

    if (!content || content.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Comment content is required'
      });
    }

    const tip = await Tip.findById(req.params.id);

    if (!tip) {
      return res.status(404).json({
        success: false,
        message: 'Tip not found'
      });
    }

    const newComment = {
      author: req.user._id,
      content: content.trim(),
      createdAt: new Date()
    };

    tip.comments.push(newComment);
    tip.commentsCount += 1;
    await tip.save();

    // Populate the new comment
    await tip.populate('comments.author', 'name avatar');

    const addedComment = tip.comments[tip.comments.length - 1];

    res.status(201).json({
      success: true,
      data: { comment: addedComment },
      message: 'Comment added successfully'
    });
  } catch (error) {
    console.error('Add tip comment error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   PUT /api/tips/:id/publish
// @desc    Publish/unpublish tip
// @access  Private/Coach/Admin
router.put('/:id/publish', protect, validateObjectId, async (req, res) => {
  try {
    const { isPublished } = req.body;

    const tip = await Tip.findById(req.params.id);

    if (!tip) {
      return res.status(404).json({
        success: false,
        message: 'Tip not found'
      });
    }

    // Only author or admin can publish
    if (req.user.role !== 'admin' && tip.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to publish this tip'
      });
    }

    tip.isPublished = isPublished;
    if (isPublished) {
      tip.publishedAt = new Date();
    }
    await tip.save();

    res.json({
      success: true,
      message: `Tip ${isPublished ? 'published' : 'unpublished'} successfully`
    });
  } catch (error) {
    console.error('Publish tip error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   DELETE /api/tips/:id
// @desc    Delete tip
// @access  Private/Coach/Admin
router.delete('/:id', protect, validateObjectId, async (req, res) => {
  try {
    const tip = await Tip.findById(req.params.id);

    if (!tip) {
      return res.status(404).json({
        success: false,
        message: 'Tip not found'
      });
    }

    // Only author or admin can delete
    if (req.user.role !== 'admin' && tip.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this tip'
      });
    }

    // Soft delete
    tip.isActive = false;
    await tip.save();

    res.json({
      success: true,
      message: 'Tip deleted successfully'
    });
  } catch (error) {
    console.error('Delete tip error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/tips/author/:authorId
// @desc    Get tips by author
// @access  Public
router.get('/author/:authorId', validateObjectId, async (req, res) => {
  try {
    const tips = await Tip.find({
      author: req.params.authorId,
      isPublished: true,
      isActive: true
    })
      .select('title content category type likesCount bookmarksCount views createdAt')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: { tips }
    });
  } catch (error) {
    console.error('Get author tips error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;