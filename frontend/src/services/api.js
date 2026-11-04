const rawEnvUrl = (import.meta.env.VITE_API_URL || '').trim().replace(/\/+$/, '');
export const BACKEND_URL = rawEnvUrl
  ? (rawEnvUrl.startsWith('http://') || rawEnvUrl.startsWith('https://') ? rawEnvUrl : `https://${rawEnvUrl}`)
  : '';
const API_BASE = BACKEND_URL ? `${BACKEND_URL}/api` : '/api';

export function resolveFileUrl(fileUrl) {
  if (!fileUrl) return '';
  if (fileUrl.startsWith('http://') || fileUrl.startsWith('https://')) {
    return fileUrl;
  }
  return BACKEND_URL ? `${BACKEND_URL}${fileUrl}` : fileUrl;
}

function getAuthHeaders(isJson = true) {
  const token = localStorage.getItem('studyshare_token');
  const headers = {};
  if (isJson) {
    headers['Content-Type'] = 'application/json';
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

// Resilient API request wrapper with descriptive error reporting
async function safeFetch(url, options = {}) {
  let res;
  try {
    res = await fetch(url, options);
  } catch (netErr) {
    console.error(`[API Network Error] ${url}:`, netErr);
    if (BACKEND_URL && !BACKEND_URL.includes('.')) {
      throw new Error(
        `Configuration Error: VITE_API_URL is set to internal hostname ("${BACKEND_URL}"). Please change VITE_API_URL in your Render Static Site Environment to your public backend URL (e.g. https://your-backend.onrender.com).`
      );
    }
    throw new Error(
      `Cannot connect to StudyShare backend (${API_BASE}). If Render free instance is waking up, please wait 30 seconds and try again.`
    );
  }

  const contentType = res.headers.get('content-type') || '';
  let data = null;

  if (contentType.includes('application/json')) {
    try {
      data = await res.json();
    } catch {
      data = null;
    }
  } else {
    if (res.status === 502 || res.status === 503) {
      throw new Error('Backend service is starting up on Render. Please wait 30 seconds and retry.');
    }
    if (res.status === 404) {
      throw new Error(`API endpoint not found on backend (${url}). Please check service deployment.`);
    }
  }

  if (!res.ok) {
    const errorMsg = data?.message || `Request failed with HTTP status ${res.status}`;
    const err = new Error(errorMsg);
    err.status = res.status;
    err.data = data;
    throw err;
  }

  return data;
}

// --- Auth APIs ---

export async function loginUser(identifier, password) {
  const data = await safeFetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier, password })
  });
  if (data?.token) {
    localStorage.setItem('studyshare_token', data.token);
  }
  return data;
}

export async function registerUser(userData) {
  const data = await safeFetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userData)
  });
  if (data?.token) {
    localStorage.setItem('studyshare_token', data.token);
  }
  return data;
}

export async function getCurrentUser() {
  const token = localStorage.getItem('studyshare_token');
  if (!token) return null;
  try {
    const data = await safeFetch(`${API_BASE}/auth/me`, {
      headers: getAuthHeaders(true)
    });
    return data?.user || null;
  } catch (err) {
    if (err.status === 401) {
      localStorage.removeItem('studyshare_token');
    }
    return null;
  }
}

export async function updateProfile(profileData) {
  return await safeFetch(`${API_BASE}/auth/profile`, {
    method: 'PUT',
    headers: getAuthHeaders(true),
    body: JSON.stringify(profileData)
  });
}

export function logoutUser() {
  localStorage.removeItem('studyshare_token');
}

// --- Resource APIs ---

export async function fetchResources(params = {}) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, val]) => {
    if (val !== undefined && val !== null && val !== '' && val !== 'ALL') {
      query.append(key, val);
    }
  });
  const res = await fetch(`${API_BASE}/resources?${query.toString()}`, {
    headers: getAuthHeaders(true)
  });
  if (!res.ok) throw new Error('Failed to fetch resources.');
  return res.json();
}

export async function fetchResourceById(id) {
  const res = await fetch(`${API_BASE}/resources/${id}`, {
    headers: getAuthHeaders(true)
  });
  if (!res.ok) throw new Error('Failed to fetch resource details.');
  return res.json();
}

export async function uploadResource(formData) {
  const token = localStorage.getItem('studyshare_token');
  const headers = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}/resources`, {
    method: 'POST',
    headers,
    body: formData // multer multipart handles boundary
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to upload resource.');
  return data;
}

export async function updateResource(id, updateData) {
  const res = await fetch(`${API_BASE}/resources/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders(true),
    body: JSON.stringify(updateData)
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to update resource.');
  return data;
}

export async function deleteResource(id) {
  const res = await fetch(`${API_BASE}/resources/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(true)
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to delete resource.');
  return data;
}

export async function recordDownload(id) {
  const res = await fetch(`${API_BASE}/resources/${id}/download`, {
    method: 'POST'
  });
  if (!res.ok) throw new Error('Failed to record download.');
  return res.json();
}

export async function upvoteResource(id) {
  const res = await fetch(`${API_BASE}/resources/${id}/upvote`, {
    method: 'POST',
    headers: getAuthHeaders(true)
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to upvote.');
  return data;
}

// --- Review APIs ---

export async function fetchReviews(resourceId) {
  const res = await fetch(`${API_BASE}/reviews/resource/${resourceId}`);
  if (!res.ok) throw new Error('Failed to load reviews.');
  return res.json();
}

export async function addReview(resourceId, { rating, comment }) {
  const res = await fetch(`${API_BASE}/reviews/resource/${resourceId}`, {
    method: 'POST',
    headers: getAuthHeaders(true),
    body: JSON.stringify({ rating, comment })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to submit review.');
  return data;
}

export async function deleteReview(reviewId) {
  const res = await fetch(`${API_BASE}/reviews/${reviewId}`, {
    method: 'DELETE',
    headers: getAuthHeaders(true)
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to delete review.');
  return data;
}

// --- Bookmark APIs (MongoDB Backed) ---

export async function fetchBookmarks() {
  const res = await fetch(`${API_BASE}/bookmarks`, {
    headers: getAuthHeaders(true)
  });
  if (!res.ok) throw new Error('Failed to load saved bookmarks.');
  return res.json();
}

export async function addBookmark(resourceId) {
  const res = await fetch(`${API_BASE}/bookmarks/${resourceId}`, {
    method: 'POST',
    headers: getAuthHeaders(true)
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to save bookmark.');
  return data;
}

export async function removeBookmark(resourceId) {
  const res = await fetch(`${API_BASE}/bookmarks/${resourceId}`, {
    method: 'DELETE',
    headers: getAuthHeaders(true)
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to remove bookmark.');
  return data;
}

// --- Community Request APIs ---

export async function fetchRequests(params = {}) {
  const query = new URLSearchParams(params).toString();
  const res = await fetch(`${API_BASE}/requests?${query}`);
  if (!res.ok) throw new Error('Failed to load community requests.');
  return res.json();
}

export async function createRequest(requestData) {
  const res = await fetch(`${API_BASE}/requests`, {
    method: 'POST',
    headers: getAuthHeaders(true),
    body: JSON.stringify(requestData)
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to post request.');
  return data;
}

export async function deleteRequest(id) {
  const res = await fetch(`${API_BASE}/requests/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(true)
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to remove request.');
  return data;
}

export async function fulfillRequest(id, resourceId) {
  const res = await fetch(`${API_BASE}/requests/${id}/fulfill`, {
    method: 'POST',
    headers: getAuthHeaders(true),
    body: JSON.stringify({ resourceId })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to fulfill request.');
  return data;
}

// --- Metadata APIs ---

export async function fetchDepartments() {
  const res = await fetch(`${API_BASE}/departments`);
  if (!res.ok) throw new Error('Failed to load departments.');
  return res.json();
}

export async function fetchStats() {
  const res = await fetch(`${API_BASE}/stats`);
  if (!res.ok) throw new Error('Failed to fetch platform metrics.');
  return res.json();
}
