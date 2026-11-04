import express from 'express';
import { Resource } from '../models/Resource.js';
import { User } from '../models/User.js';
import { Request } from '../models/Request.js';

const router = express.Router();

export const departmentDefinitions = [
  {
    code: 'CSE',
    name: 'Computer Science & Engineering',
    subjects: [
      'Data Structures & Algorithms',
      'Database Management Systems',
      'Operating Systems',
      'Computer Networks',
      'Theory of Computation',
      'Compiler Design',
      'Artificial Intelligence',
      'Web Technologies',
      'Software Engineering'
    ]
  },
  {
    code: 'AIDS',
    name: 'AI & Data Science',
    subjects: [
      'Machine Learning',
      'Deep Learning',
      'Data Mining & Warehousing',
      'Natural Language Processing',
      'Big Data Analytics',
      'Mathematics for Data Science',
      'Computer Vision'
    ]
  },
  {
    code: 'IT',
    name: 'Information Technology',
    subjects: [
      'Cloud Computing',
      'Cyber Security',
      'Full Stack Development',
      'Information Storage & Management',
      'Mobile App Development',
      'DevOps & CI/CD'
    ]
  },
  {
    code: 'ECE',
    name: 'Electronics & Communication',
    subjects: [
      'Digital Signal Processing',
      'Signals & Systems',
      'Microprocessors & Microcontrollers',
      'VLSI Design',
      'Analog Electronics',
      'Communication Engineering'
    ]
  },
  {
    code: 'MECH',
    name: 'Mechanical Engineering',
    subjects: [
      'Thermodynamics',
      'Fluid Mechanics',
      'Theory of Machines',
      'Strength of Materials',
      'Manufacturing Technology',
      'Heat & Mass Transfer'
    ]
  },
  {
    code: 'CIVIL',
    name: 'Civil Engineering',
    subjects: [
      'Structural Analysis',
      'Geotechnical Engineering',
      'Hydraulics & Fluid Mechanics',
      'Surveying',
      'Environmental Engineering',
      'Concrete Technology'
    ]
  },
  {
    code: 'EE',
    name: 'Electrical Engineering',
    subjects: [
      'Power Systems',
      'Control Systems',
      'Electrical Machines',
      'Power Electronics',
      'Electromagnetic Fields',
      'Circuit Theory'
    ]
  },
  {
    code: 'GEN',
    name: 'First Year / Basic Sciences',
    subjects: [
      'Engineering Mathematics I & II',
      'Engineering Physics',
      'Engineering Chemistry',
      'Basic Electrical & Electronics',
      'Programming in C',
      'Engineering Graphics'
    ]
  }
];

// GET /api/departments - Live counts from MongoDB
router.get('/departments', async (req, res) => {
  try {
    const counts = await Resource.aggregate([
      { $group: { _id: '$department', count: { $sum: 1 } } }
    ]);

    const countMap = {};
    counts.forEach(c => {
      countMap[c._id] = c.count;
    });

    const data = departmentDefinitions.map(dept => ({
      ...dept,
      resourceCount: countMap[dept.code] || 0
    }));

    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/stats - Real aggregated metrics from MongoDB
router.get('/stats', async (req, res) => {
  try {
    const [totalResources, totalUsers, totalRequests, downloadAgg, categoryAgg, subjectAgg] = await Promise.all([
      Resource.countDocuments(),
      User.countDocuments(),
      Request.countDocuments(),
      Resource.aggregate([{ $group: { _id: null, totalDownloads: { $sum: '$downloadCount' } } }]),
      Resource.aggregate([{ $group: { _id: '$category', count: { $sum: 1 } } }]),
      Resource.aggregate([
        { $group: { _id: '$subject', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 6 }
      ])
    ]);

    const totalDownloads = (downloadAgg[0] && downloadAgg[0].totalDownloads) || 0;

    const categoryCounts = {};
    categoryAgg.forEach(c => {
      categoryCounts[c._id] = c.count;
    });

    const topSubjects = subjectAgg.map(s => ({
      subject: s._id,
      count: s.count
    }));

    res.json({
      success: true,
      data: {
        totalResources,
        totalUsers,
        totalDownloads,
        totalRequests,
        departmentCount: departmentDefinitions.length,
        categoryCounts,
        topSubjects
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
