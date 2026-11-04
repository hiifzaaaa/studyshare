import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import { initialUsers, initialDepartments, initialResources, initialRequests } from './initialData.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbFilePath = path.join(__dirname, 'database.json');
const uploadsDir = path.join(__dirname, '..', 'uploads');

class DataStore {
  constructor() {
    this.init();
  }

  init() {
    if (!fs.existsSync(dbFilePath)) {
      const defaultData = {
        users: initialUsers,
        departments: initialDepartments,
        resources: initialResources,
        requests: initialRequests
      };
      this.save(defaultData);
    } else {
      // Auto-migrate if users or uploaderIds are missing
      const data = this.load();
      let changed = false;
      if (!data.users || data.users.length === 0) {
        data.users = initialUsers;
        changed = true;
      }
      if (data.resources) {
        data.resources.forEach((r, idx) => {
          if (!r.uploaderId) {
            // Assign to one of the initial users
            const fallbackUser = initialUsers[idx % initialUsers.length];
            r.uploaderId = fallbackUser.id;
            r.uploaderName = fallbackUser.name;
            r.uploaderEmail = fallbackUser.email;
            changed = true;
          }
        });
      }
      if (changed) {
        this.save(data);
      }
    }
  }

  load() {
    try {
      if (!fs.existsSync(dbFilePath)) {
        this.init();
      }
      const data = fs.readFileSync(dbFilePath, 'utf8');
      return JSON.parse(data);
    } catch (err) {
      console.error('Error loading database, resetting to initial:', err);
      const defaultData = {
        users: initialUsers,
        departments: initialDepartments,
        resources: initialResources,
        requests: initialRequests
      };
      this.save(defaultData);
      return defaultData;
    }
  }

  save(data) {
    fs.writeFileSync(dbFilePath, JSON.stringify(data, null, 2), 'utf8');
  }

  // --- User & Auth Methods ---

  findUserByEmail(email) {
    if (!email) return null;
    const data = this.load();
    return (data.users || []).find(u => u.email.toLowerCase() === email.trim().toLowerCase()) || null;
  }

  findUserById(id) {
    if (!id) return null;
    const data = this.load();
    const user = (data.users || []).find(u => u.id === id);
    if (!user) return null;
    const { password, ...safeUser } = user;
    return safeUser;
  }

  registerUser({ name, email, password, department, semester, role }) {
    const data = this.load();
    if (!data.users) data.users = [];

    const existing = this.findUserByEmail(email);
    if (existing) {
      throw new Error('A user with this email address already exists. Please log in.');
    }

    const newUser = {
      id: `usr-${crypto.randomUUID().slice(0, 8)}`,
      name: name ? name.trim() : 'Student',
      email: email.trim().toLowerCase(),
      password: password, // In production you would use bcrypt
      department: department || 'CSE',
      semester: Number(semester) || 1,
      role: role || 'Student',
      createdAt: new Date().toISOString()
    };

    data.users.push(newUser);
    this.save(data);

    const { password: _, ...safeUser } = newUser;
    return safeUser;
  }

  loginUser(email, password) {
    const user = this.findUserByEmail(email);
    if (!user) {
      throw new Error('No account found with this email address.');
    }
    if (user.password !== password) {
      throw new Error('Incorrect password. Please try again.');
    }

    const { password: _, ...safeUser } = user;
    return safeUser;
  }

  // --- Department Methods ---

  getDepartments() {
    const data = this.load();
    const counts = {};
    for (const r of data.resources) {
      counts[r.department] = (counts[r.department] || 0) + 1;
    }
    return data.departments.map(d => ({
      ...d,
      resourceCount: counts[d.code] || 0
    }));
  }

  // --- Resource Methods ---

  getResources(query = {}) {
    const data = this.load();
    let results = [...data.resources];

    const {
      department,
      semester,
      subject,
      category,
      search,
      sort,
      academicYear,
      uploaderId
    } = query;

    if (uploaderId) {
      results = results.filter(r => r.uploaderId === uploaderId);
    }

    if (department && department !== 'ALL') {
      results = results.filter(r => r.department.toLowerCase() === department.toLowerCase());
    }

    if (semester && semester !== 'ALL') {
      const semNum = parseInt(semester, 10);
      if (!isNaN(semNum)) {
        results = results.filter(r => Number(r.semester) === semNum);
      }
    }

    if (subject && subject !== 'ALL') {
      results = results.filter(r => r.subject.toLowerCase() === subject.toLowerCase());
    }

    if (category && category !== 'ALL') {
      results = results.filter(r => r.category.toLowerCase() === category.toLowerCase());
    }

    if (academicYear && academicYear !== 'ALL') {
      results = results.filter(r => r.academicYear === academicYear);
    }

    if (search && search.trim() !== '') {
      const q = search.trim().toLowerCase();
      results = results.filter(r => {
        const titleMatch = r.title && r.title.toLowerCase().includes(q);
        const descMatch = r.description && r.description.toLowerCase().includes(q);
        const subMatch = r.subject && r.subject.toLowerCase().includes(q);
        const deptMatch = r.department && r.department.toLowerCase().includes(q);
        const uploaderMatch = r.uploaderName && r.uploaderName.toLowerCase().includes(q);
        const tagMatch = r.tags && r.tags.some(t => t.toLowerCase().includes(q));
        return titleMatch || descMatch || subMatch || deptMatch || uploaderMatch || tagMatch;
      });
    }

    // Sorting
    switch (sort) {
      case 'most_popular':
      case 'popular':
        results.sort((a, b) => (b.upvotes + b.downloads * 0.5) - (a.upvotes + a.downloads * 0.5));
        break;
      case 'highest_rated':
      case 'rating':
        results.sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0));
        break;
      case 'most_downloaded':
      case 'downloads':
        results.sort((a, b) => (b.downloads || 0) - (a.downloads || 0));
        break;
      case 'oldest':
        results.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        break;
      case 'newest':
      default:
        results.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        break;
    }

    return results;
  }

  getResourceById(id) {
    const data = this.load();
    return data.resources.find(r => r.id === id) || null;
  }

  createResource(payload) {
    const data = this.load();
    const newResource = {
      id: `res-${crypto.randomUUID().slice(0, 8)}`,
      title: payload.title || 'Untitled Resource',
      description: payload.description || '',
      department: payload.department || 'CSE',
      semester: Number(payload.semester) || 1,
      subject: payload.subject || 'General',
      category: payload.category || 'Notes',
      type: payload.type || 'file',
      fileUrl: payload.fileUrl || '',
      originalFilename: payload.originalFilename || 'document.pdf',
      fileSize: payload.fileSize || 0,
      fileType: payload.fileType || 'application/pdf',
      linkUrl: payload.linkUrl || '',
      academicYear: payload.academicYear || '2025-2026',
      examType: payload.examType || 'General',
      tags: Array.isArray(payload.tags) ? payload.tags : (payload.tags ? payload.tags.split(',').map(t => t.trim()).filter(Boolean) : []),
      uploaderId: payload.uploaderId || 'usr-anon',
      uploaderName: payload.uploaderName || 'Anonymous Student',
      uploaderEmail: payload.uploaderEmail || '',
      uploaderRole: payload.uploaderRole || 'Student',
      createdAt: new Date().toISOString(),
      downloads: 0,
      upvotes: 0,
      upvotedBy: [],
      ratings: [],
      averageRating: 5.0
    };

    data.resources.unshift(newResource);
    this.save(data);
    return newResource;
  }

  upvoteResource(id, userId = 'user_anon') {
    const data = this.load();
    const index = data.resources.findIndex(r => r.id === id);
    if (index === -1) return null;

    const resource = data.resources[index];
    if (!resource.upvotedBy) resource.upvotedBy = [];

    const hasUpvoted = resource.upvotedBy.includes(userId);
    if (hasUpvoted) {
      resource.upvotes = Math.max(0, resource.upvotes - 1);
      resource.upvotedBy = resource.upvotedBy.filter(u => u !== userId);
    } else {
      resource.upvotes += 1;
      resource.upvotedBy.push(userId);
    }

    this.save(data);
    return { upvotes: resource.upvotes, hasUpvoted: !hasUpvoted };
  }

  incrementDownload(id) {
    const data = this.load();
    const resource = data.resources.find(r => r.id === id);
    if (!resource) return null;
    resource.downloads = (resource.downloads || 0) + 1;
    this.save(data);
    return resource.downloads;
  }

  addReview(id, { rating, comment, author }) {
    const data = this.load();
    const resource = data.resources.find(r => r.id === id);
    if (!resource) return null;

    if (!resource.ratings) resource.ratings = [];

    const reviewObj = {
      id: `rev-${crypto.randomUUID().slice(0, 8)}`,
      rating: Math.max(1, Math.min(5, Number(rating) || 5)),
      comment: comment ? comment.trim() : '',
      author: author ? author.trim() : 'Verified Student',
      date: new Date().toISOString()
    };

    resource.ratings.unshift(reviewObj);

    // Recalculate average
    const total = resource.ratings.reduce((sum, r) => sum + r.rating, 0);
    resource.averageRating = Number((total / resource.ratings.length).toFixed(1));

    this.save(data);
    return { review: reviewObj, averageRating: resource.averageRating, totalReviews: resource.ratings.length };
  }

  /**
   * Strict deletion authorization:
   * Only the student who uploaded the file (resource.uploaderId === requestingUserId) can delete it!
   */
  deleteResource(id, requestingUserId) {
    const data = this.load();
    const index = data.resources.findIndex(r => r.id === id);
    if (index === -1) {
      return { success: false, status: 404, message: 'Resource not found' };
    }

    const resource = data.resources[index];

    // Authorization check
    if (!requestingUserId || resource.uploaderId !== requestingUserId) {
      return {
        success: false,
        status: 403,
        message: 'Permission Denied: Only the student who uploaded this resource can delete it!'
      };
    }

    // Attempt to delete physical file from disk if local upload
    if (resource.type === 'file' && resource.fileUrl && resource.fileUrl.startsWith('/uploads/')) {
      const fileName = path.basename(resource.fileUrl);
      const fullPath = path.join(uploadsDir, fileName);
      try {
        if (fs.existsSync(fullPath)) {
          fs.unlinkSync(fullPath);
        }
      } catch (err) {
        console.warn('Could not remove file from disk:', fullPath, err.message);
      }
    }

    // Remove from database
    data.resources.splice(index, 1);
    this.save(data);
    return { success: true, status: 200, message: 'Resource deleted successfully' };
  }

  // --- Request Methods ---

  getRequests() {
    const data = this.load();
    return data.requests.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  createRequest(payload) {
    const data = this.load();
    const newRequest = {
      id: `req-${crypto.randomUUID().slice(0, 8)}`,
      title: payload.title || 'Resource Request',
      department: payload.department || 'CSE',
      semester: Number(payload.semester) || 1,
      subject: payload.subject || 'General',
      description: payload.description || '',
      urgency: payload.urgency || 'Medium',
      requesterId: payload.requesterId || 'usr-anon',
      requesterName: payload.requesterName || 'Student',
      status: 'Open',
      createdAt: new Date().toISOString()
    };
    data.requests.unshift(newRequest);
    this.save(data);
    return newRequest;
  }

  fulfillRequest(id, resourceId) {
    const data = this.load();
    const req = data.requests.find(r => r.id === id);
    if (!req) return null;
    req.status = 'Fulfilled';
    req.fulfilledWithId = resourceId || null;
    this.save(data);
    return req;
  }

  // --- Platform Stats ---

  getStats() {
    const data = this.load();
    const totalResources = data.resources.length;
    const totalDownloads = data.resources.reduce((sum, r) => sum + (r.downloads || 0), 0);
    const totalUpvotes = data.resources.reduce((sum, r) => sum + (r.upvotes || 0), 0);
    const totalRequests = data.requests.length;

    const categoryCounts = {};
    for (const r of data.resources) {
      categoryCounts[r.category] = (categoryCounts[r.category] || 0) + 1;
    }

    const subjectCounts = {};
    for (const r of data.resources) {
      subjectCounts[r.subject] = (subjectCounts[r.subject] || 0) + 1;
    }

    return {
      totalResources,
      totalDownloads,
      totalUpvotes,
      totalRequests,
      departmentCount: data.departments.length,
      categoryCounts,
      topSubjects: Object.entries(subjectCounts)
        .map(([subject, count]) => ({ subject, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5)
    };
  }
}

export const store = new DataStore();
