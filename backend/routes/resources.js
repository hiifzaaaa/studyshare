import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Resource } from '../models/Resource.js';
import { Review } from '../models/Review.js';
import { Bookmark } from '../models/Bookmark.js';
import { requireAuth, optionalAuth } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.join(__dirname, '..', 'uploads');

const router = express.Router();

// GET /api/resources - Browse, Search, Filter & Sort
router.get('/', optionalAuth, async (req, res) => {
  try {
    const {
      department,
      semester,
      subject,
      category,
      academicYear,
      search,
      sort,
      uploader,
      limit = 50,
      page = 1
    } = req.query;

    const filter = {};

    if (department && department !== 'ALL') {
      filter.department = department.toUpperCase();
    }

    if (semester && semester !== 'ALL') {
      const semNum = parseInt(semester, 10);
      if (!isNaN(semNum)) filter.semester = semNum;
    }

    if (subject && subject !== 'ALL') {
      filter.subject = new RegExp(`^${subject}$`, 'i');
    }

    if (category && category !== 'ALL') {
      filter.category = category;
    }

    if (academicYear && academicYear !== 'ALL') {
      filter.academicYear = academicYear;
    }

    if (uploader) {
      filter.uploader = uploader;
    }

    // Search query across title, subject, description, and tags
    if (search && search.trim()) {
      const q = search.trim();
      filter.$or = [
        { title: { $regex: q, $options: 'i' } },
        { subject: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } },
        { tags: { $in: [new RegExp(q, 'i')] } }
      ];
    }

    // Sorting
    let sortQuery = { createdAt: -1 }; // default newest
    switch (sort) {
      case 'popular':
      case 'most_popular':
        sortQuery = { downloadCount: -1, averageRating: -1 };
        break;
      case 'rating':
      case 'highest_rated':
        sortQuery = { averageRating: -1, reviewCount: -1 };
        break;
      case 'downloads':
      case 'most_downloaded':
        sortQuery = { downloadCount: -1 };
        break;
      case 'oldest':
        sortQuery = { createdAt: 1 };
        break;
      case 'newest':
      default:
        sortQuery = { createdAt: -1 };
        break;
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 50));
    const skip = (pageNum - 1) * limitNum;

    const [resources, total] = await Promise.all([
      Resource.find(filter)
        .populate('uploader', 'username fullName department role')
        .sort(sortQuery)
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Resource.countDocuments(filter)
    ]);

    // Attach bookmark flag if user is logged in
    let userBookmarks = new Set();
    if (req.user) {
      const bookmarks = await Bookmark.find({ user: req.user._id }).select('resource').lean();
      userBookmarks = new Set(bookmarks.map(b => b.resource.toString()));
    }

    const enhanced = resources.map(r => ({
      ...r,
      id: r._id.toString(),
      isBookmarked: userBookmarks.has(r._id.toString()),
      hasUpvoted: req.user ? (r.upvotes || []).some(uid => uid.toString() === req.user._id.toString()) : false,
      upvotesCount: (r.upvotes || []).length
    }));

    res.json({
      success: true,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum),
      count: enhanced.length,
      data: enhanced
    });
  } catch (err) {
    console.error('Fetch resources error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/resources/:id - Single Resource Detail
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const resource = await Resource.findById(req.params.id)
      .populate('uploader', 'username fullName department semester role')
      .lean();

    if (!resource) {
      return res.status(404).json({ success: false, message: 'Resource not found' });
    }

    // Fetch associated reviews
    const reviews = await Review.find({ resource: resource._id })
      .populate('user', 'username fullName department')
      .sort({ createdAt: -1 })
      .lean();

    // Check if current user has bookmarked or upvoted
    let isBookmarked = false;
    let hasUpvoted = false;
    if (req.user) {
      const bookmark = await Bookmark.findOne({ user: req.user._id, resource: resource._id });
      isBookmarked = !!bookmark;
      hasUpvoted = (resource.upvotes || []).some(uid => uid.toString() === req.user._id.toString());
    }

    res.json({
      success: true,
      data: {
        ...resource,
        id: resource._id.toString(),
        isBookmarked,
        hasUpvoted,
        upvotesCount: (resource.upvotes || []).length,
        reviews
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/resources - Upload / Share Resource (Protected)
router.post('/', requireAuth, upload.single('file'), async (req, res) => {
  try {
    const {
      title,
      description,
      department,
      semester,
      subject,
      category,
      academicYear,
      examType,
      tags,
      type,
      linkUrl
    } = req.body;

    if (!title || !department || !semester || !subject || !category) {
      return res.status(400).json({
        success: false,
        message: 'Title, department, semester, subject, and category are required.'
      });
    }

    let fileUrl = '';
    let originalFilename = '';
    let fileSize = 0;
    let fileType = '';

    if (type === 'link') {
      if (!linkUrl || !linkUrl.trim().startsWith('http')) {
        return res.status(400).json({
          success: false,
          message: 'A valid URL starting with http:// or https:// is required for web resources.'
        });
      }
      originalFilename = title.trim();
      fileType = 'external/link';
    } else {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'Please select a document to upload (PDF, Word, PPT, Image, ZIP).'
        });
      }
      fileUrl = `/uploads/${req.file.filename}`;
      originalFilename = req.file.originalname;
      fileSize = req.file.size;
      fileType = req.file.mimetype;
    }

    // Process tags
    let parsedTags = [];
    if (Array.isArray(tags)) {
      parsedTags = tags;
    } else if (typeof tags === 'string' && tags.trim()) {
      parsedTags = tags.split(',').map(t => t.trim()).filter(Boolean);
    }

    const newResource = await Resource.create({
      title: title.trim(),
      description: description ? description.trim() : '',
      department: department.toUpperCase(),
      semester: parseInt(semester, 10) || 1,
      subject: subject.trim(),
      category,
      academicYear: academicYear || '2025-2026',
      examType: examType || 'General',
      tags: parsedTags,
      type: type || 'file',
      fileUrl,
      originalFilename,
      fileSize,
      fileType,
      linkUrl: linkUrl ? linkUrl.trim() : '',
      uploader: req.user._id,
      uploaderName: req.user.fullName,
      uploaderDepartment: req.user.department
    });

    res.status(201).json({
      success: true,
      message: 'Resource published successfully to StudyShare.',
      data: {
        ...newResource.toObject(),
        id: newResource._id.toString()
      }
    });
  } catch (err) {
    console.error('Create resource error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/resources/:id - Update Resource (Owner only)
router.put('/:id', requireAuth, async (req, res) => {
  try {
    const resource = await Resource.findById(req.params.id);
    if (!resource) {
      return res.status(404).json({ success: false, message: 'Resource not found' });
    }

    // Strict ownership verification
    if (resource.uploader.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Permission Denied: You can only edit resources that you uploaded.'
      });
    }

    const { title, description, subject, category, academicYear, examType, tags } = req.body;
    if (title) resource.title = title.trim();
    if (description !== undefined) resource.description = description.trim();
    if (subject) resource.subject = subject.trim();
    if (category) resource.category = category;
    if (academicYear) resource.academicYear = academicYear;
    if (examType) resource.examType = examType;
    if (tags !== undefined) {
      resource.tags = Array.isArray(tags) ? tags : tags.split(',').map(t => t.trim()).filter(Boolean);
    }

    await resource.save();

    res.json({
      success: true,
      message: 'Resource updated successfully.',
      data: { ...resource.toObject(), id: resource._id.toString() }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/resources/:id - Delete Resource (Owner only!)
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const resource = await Resource.findById(req.params.id);
    if (!resource) {
      return res.status(404).json({ success: false, message: 'Resource not found' });
    }

    // Strict ownership verification: ONLY the original uploader or admin can delete
    if (resource.uploader.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Permission Denied: Only the student who uploaded this resource can delete it!'
      });
    }

    // Remove physical file from disk if local upload
    if (resource.type === 'file' && resource.fileUrl && resource.fileUrl.startsWith('/uploads/')) {
      const fileName = path.basename(resource.fileUrl);
      const filePath = path.join(uploadsDir, fileName);
      try {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      } catch (err) {
        console.warn('Could not remove file from disk:', filePath, err.message);
      }
    }

    // Cascade delete associated reviews & bookmarks
    await Promise.all([
      Review.deleteMany({ resource: resource._id }),
      Bookmark.deleteMany({ resource: resource._id }),
      Resource.findByIdAndDelete(resource._id)
    ]);

    res.json({
      success: true,
      message: 'Resource deleted permanently.'
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/resources/:id/download - Increment download count
router.post('/:id/download', async (req, res) => {
  try {
    const resource = await Resource.findByIdAndUpdate(
      req.params.id,
      { $inc: { downloadCount: 1 } },
      { new: true }
    );
    if (!resource) {
      return res.status(404).json({ success: false, message: 'Resource not found' });
    }
    res.json({ success: true, downloadCount: resource.downloadCount });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/resources/:id/upvote - Toggle upvote
router.post('/:id/upvote', requireAuth, async (req, res) => {
  try {
    const resource = await Resource.findById(req.params.id);
    if (!resource) {
      return res.status(404).json({ success: false, message: 'Resource not found' });
    }

    const userIdStr = req.user._id.toString();
    const index = resource.upvotes.findIndex(uid => uid.toString() === userIdStr);

    let hasUpvoted = false;
    if (index === -1) {
      resource.upvotes.push(req.user._id);
      hasUpvoted = true;
    } else {
      resource.upvotes.splice(index, 1);
      hasUpvoted = false;
    }

    await resource.save();

    res.json({
      success: true,
      upvotesCount: resource.upvotes.length,
      hasUpvoted
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
