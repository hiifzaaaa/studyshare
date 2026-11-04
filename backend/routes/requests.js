import express from 'express';
import { Request } from '../models/Request.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

// GET /api/requests - List all requests
router.get('/', async (req, res) => {
  try {
    const { status, department } = req.query;
    const filter = {};
    if (status && status !== 'ALL') filter.status = status;
    if (department && department !== 'ALL') filter.department = department.toUpperCase();

    const requests = await Request.find(filter)
      .populate('requester', 'username fullName department semester role')
      .populate('fulfilledBy', 'username fullName department')
      .sort({ createdAt: -1 })
      .lean();

    const formatted = requests.map(r => ({
      ...r,
      id: r._id.toString()
    }));

    res.json({
      success: true,
      count: formatted.length,
      data: formatted
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/requests - Create Request (Protected)
router.post('/', requireAuth, async (req, res) => {
  try {
    const { title, description, department, semester, subject, urgency } = req.body;

    if (!title || !department || !semester || !subject) {
      return res.status(400).json({
        success: false,
        message: 'Title, department, semester, and subject are required.'
      });
    }

    const request = await Request.create({
      title: title.trim(),
      description: description ? description.trim() : '',
      department: department.toUpperCase(),
      semester: parseInt(semester, 10),
      subject: subject.trim(),
      urgency: urgency || 'Medium',
      requester: req.user._id,
      requesterName: req.user.fullName
    });

    const populated = await Request.findById(request._id)
      .populate('requester', 'username fullName department semester role')
      .lean();

    res.status(201).json({
      success: true,
      message: 'Request posted to community board.',
      data: {
        ...populated,
        id: populated._id.toString()
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/requests/:id - Delete Request (Requester only)
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const request = await Request.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ success: false, message: 'Request not found' });
    }

    if (request.requester.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Permission Denied: You can only delete requests you posted.'
      });
    }

    await Request.findByIdAndDelete(request._id);

    res.json({ success: true, message: 'Request removed from board.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/requests/:id/fulfill - Mark Request Fulfilled (Protected)
router.post('/:id/fulfill', requireAuth, async (req, res) => {
  try {
    const { resourceId } = req.body;
    const request = await Request.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ success: false, message: 'Request not found' });
    }

    request.status = 'Fulfilled';
    request.fulfilledBy = req.user._id;
    if (resourceId) request.fulfilledResource = resourceId;

    await request.save();

    const populated = await Request.findById(request._id)
      .populate('requester', 'username fullName department semester role')
      .populate('fulfilledBy', 'username fullName department')
      .lean();

    res.json({
      success: true,
      message: 'Request marked as fulfilled! Thank you for helping your peer.',
      data: { ...populated, id: populated._id.toString() }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
