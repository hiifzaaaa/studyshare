import express from 'express';
import { Bookmark } from '../models/Bookmark.js';
import { Resource } from '../models/Resource.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

// GET /api/bookmarks - List user's saved resources (Protected)
router.get('/', requireAuth, async (req, res) => {
  try {
    const bookmarks = await Bookmark.find({ user: req.user._id })
      .populate({
        path: 'resource',
        populate: { path: 'uploader', select: 'username fullName department role' }
      })
      .sort({ createdAt: -1 })
      .lean();

    // Filter out any bookmarks whose resource might have been deleted
    const validBookmarks = bookmarks
      .filter(b => b.resource !== null)
      .map(b => ({
        bookmarkId: b._id.toString(),
        savedAt: b.createdAt,
        ...b.resource,
        id: b.resource._id.toString(),
        isBookmarked: true
      }));

    res.json({
      success: true,
      count: validBookmarks.length,
      data: validBookmarks
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/bookmarks/:resourceId - Bookmark resource (Protected)
router.post('/:resourceId', requireAuth, async (req, res) => {
  try {
    const resource = await Resource.findById(req.params.resourceId);
    if (!resource) {
      return res.status(404).json({ success: false, message: 'Resource not found' });
    }

    const bookmark = await Bookmark.findOneAndUpdate(
      { user: req.user._id, resource: resource._id },
      { $setOnInsert: { user: req.user._id, resource: resource._id } },
      { upsert: true, new: true }
    );

    res.status(201).json({
      success: true,
      message: 'Resource saved to your revision library.',
      data: bookmark
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/bookmarks/:resourceId - Remove Bookmark (Protected)
router.delete('/:resourceId', requireAuth, async (req, res) => {
  try {
    await Bookmark.findOneAndDelete({
      user: req.user._id,
      resource: req.params.resourceId
    });

    res.json({
      success: true,
      message: 'Resource removed from saved library.'
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
