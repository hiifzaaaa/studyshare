import express from 'express';
import { Review } from '../models/Review.js';
import { Resource } from '../models/Resource.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

// Helper to recalculate average rating for a resource
async function updateResourceRating(resourceId) {
  const reviews = await Review.find({ resource: resourceId });
  if (reviews.length === 0) {
    await Resource.findByIdAndUpdate(resourceId, { averageRating: 0, reviewCount: 0 });
    return { averageRating: 0, reviewCount: 0 };
  }

  const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
  const averageRating = Number((sum / reviews.length).toFixed(1));
  const reviewCount = reviews.length;

  await Resource.findByIdAndUpdate(resourceId, { averageRating, reviewCount });
  return { averageRating, reviewCount };
}

// GET /api/reviews/resource/:resourceId - List reviews
router.get('/resource/:resourceId', async (req, res) => {
  try {
    const reviews = await Review.find({ resource: req.params.resourceId })
      .populate('user', 'username fullName department role')
      .sort({ createdAt: -1 })
      .lean();

    res.json({ success: true, count: reviews.length, data: reviews });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/reviews/resource/:resourceId - Add Review (Protected)
router.post('/resource/:resourceId', requireAuth, async (req, res) => {
  try {
    const { rating, comment } = req.body;
    const resourceId = req.params.resourceId;

    if (!rating || !comment || !comment.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Rating (1 to 5) and feedback comment are required.'
      });
    }

    const numRating = Number(rating);
    if (isNaN(numRating) || numRating < 1 || numRating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be an integer between 1 and 5.'
      });
    }

    const resource = await Resource.findById(resourceId);
    if (!resource) {
      return res.status(404).json({ success: false, message: 'Resource not found' });
    }

    // Prevent duplicate reviews from the same student
    const existing = await Review.findOne({ user: req.user._id, resource: resourceId });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'You have already submitted a review for this study resource.'
      });
    }

    const review = await Review.create({
      user: req.user._id,
      resource: resourceId,
      rating: numRating,
      comment: comment.trim()
    });

    const populatedReview = await Review.findById(review._id)
      .populate('user', 'username fullName department role')
      .lean();

    // Recalculate average rating on resource
    const stats = await updateResourceRating(resourceId);

    res.status(201).json({
      success: true,
      message: 'Review posted successfully.',
      data: populatedReview,
      averageRating: stats.averageRating,
      reviewCount: stats.reviewCount
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'You have already reviewed this resource.'
      });
    }
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/reviews/:id - Delete own review
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found' });
    }

    if (review.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Permission Denied: You can only delete your own reviews.'
      });
    }

    const resourceId = review.resource;
    await Review.findByIdAndDelete(review._id);

    // Recalculate average rating
    const stats = await updateResourceRating(resourceId);

    res.json({
      success: true,
      message: 'Review deleted.',
      averageRating: stats.averageRating,
      reviewCount: stats.reviewCount
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
