import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import FilterBar from './components/FilterBar';
import ResourceCard from './components/ResourceCard';
import ResourceModal from './components/ResourceModal';
import UploadModal from './components/UploadModal';
import RequestsBoardModal from './components/RequestsBoardModal';
import BookmarksDrawer from './components/BookmarksDrawer';
import AuthModal from './components/AuthModal';
import ProfileModal from './components/ProfileModal';
import DeleteConfirmModal from './components/DeleteConfirmModal';
import LoginPage from './components/LoginPage';
import Footer from './components/Footer';
import { 
  fetchDepartments, 
  fetchResources, 
  fetchRequests, 
  fetchStats, 
  fetchBookmarks,
  addBookmark,
  removeBookmark,
  upvoteResource, 
  recordDownload,
  deleteResource,
  getCurrentUser,
  logoutUser
} from './services/api';
import { 
  FileSearch, 
  Upload, 
  CheckCircle2, 
  AlertCircle,
  FolderOpen,
  Bookmark,
  HelpCircle,
  Layers,
  ArrowRight
} from 'lucide-react';

export default function App() {
  // Authentication State
  const [currentUser, setCurrentUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  // App Navigation & Tabs
  const [currentTab, setCurrentTab] = useState('repository'); // 'repository' | 'requests' | 'bookmarks'
  const [isMyUploadsActive, setIsMyUploadsActive] = useState(false);

  // Data State (from MongoDB)
  const [departments, setDepartments] = useState([]);
  const [resources, setResources] = useState([]);
  const [bookmarks, setBookmarks] = useState([]);
  const [requests, setRequests] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  // Filter State
  const [selectedDepartment, setSelectedDepartment] = useState('ALL');
  const [selectedSemester, setSelectedSemester] = useState('ALL');
  const [selectedSubject, setSelectedSubject] = useState('ALL');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [sortBy, setSortBy] = useState('newest');
  const [searchTerm, setSearchTerm] = useState('');

  // Modals
  const [selectedResource, setSelectedResource] = useState(null);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isRequestsOpen, setIsRequestsOpen] = useState(false);
  const [isBookmarksOpen, setIsBookmarksOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState('login');
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [resourceToDelete, setResourceToDelete] = useState(null);

  // Notification Toast
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // 1. Initial Load: Check active session with MongoDB & load initial metadata
  useEffect(() => {
    const initApp = async () => {
      try {
        const user = await getCurrentUser();
        setCurrentUser(user);

        const [deptRes, statRes, reqRes] = await Promise.all([
          fetchDepartments(),
          fetchStats(),
          fetchRequests()
        ]);
        if (deptRes.data) setDepartments(deptRes.data);
        if (statRes.data) setStats(statRes.data);
        if (reqRes.data) setRequests(reqRes.data);

        if (user) {
          const bRes = await fetchBookmarks();
          if (bRes.data) setBookmarks(bRes.data);
        }
      } catch (err) {
        console.error('App init error:', err);
      } finally {
        setAuthLoading(false);
      }
    };
    initApp();
  }, []);

  // 2. Fetch Resources on Filter / Search change
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const params = {
          department: selectedDepartment,
          semester: selectedSemester,
          subject: selectedSubject,
          category: selectedCategory,
          sort: sortBy,
          search: searchTerm
        };

        if (isMyUploadsActive && currentUser) {
          params.uploader = currentUser.id || currentUser._id;
        }

        const res = await fetchResources(params);
        if (res.data) {
          setResources(res.data);
        }
      } catch (err) {
        console.error('Failed to load resources:', err);
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(() => {
      loadData();
    }, 200);

    return () => clearTimeout(timer);
  }, [selectedDepartment, selectedSemester, selectedSubject, selectedCategory, sortBy, searchTerm, isMyUploadsActive, currentUser]);

  // Auth Handlers
  const handleOpenAuth = (mode = 'login') => {
    setAuthMode(mode);
    setIsAuthOpen(true);
  };

  const handleAuthSuccess = async (user) => {
    setCurrentUser(user);
    showToast(`Welcome back, ${user.fullName}!`);
    // Load user's bookmarks from MongoDB
    try {
      const bRes = await fetchBookmarks();
      if (bRes.data) setBookmarks(bRes.data);
    } catch {
      // Ignored
    }
  };

  const handleLogout = () => {
    logoutUser();
    setCurrentUser(null);
    setBookmarks([]);
    setIsMyUploadsActive(false);
    showToast('Signed out successfully.', 'info');
  };

  // Bookmark Toggle (MongoDB Persistent)
  const handleToggleBookmark = async (resource) => {
    if (!currentUser) {
      handleOpenAuth('login');
      showToast('Please sign in to save materials to your library.', 'info');
      return;
    }

    const resId = resource.id || resource._id;
    const isSaved = bookmarks.some(b => (b.id || b._id) === resId);

    try {
      if (isSaved) {
        await removeBookmark(resId);
        setBookmarks(prev => prev.filter(b => (b.id || b._id) !== resId));
        setResources(prev => prev.map(r => (r.id || r._id) === resId ? { ...r, isBookmarked: false } : r));
        showToast('Removed from saved library.', 'info');
      } else {
        await addBookmark(resId);
        setBookmarks(prev => [resource, ...prev]);
        setResources(prev => prev.map(r => (r.id || r._id) === resId ? { ...r, isBookmarked: true } : r));
        showToast('Saved to your revision library.');
      }
    } catch (err) {
      showToast(err.message || 'Error updating bookmark', 'info');
    }
  };

  const handleRemoveBookmark = async (resId) => {
    try {
      await removeBookmark(resId);
      setBookmarks(prev => prev.filter(b => (b.id || b._id) !== resId));
      setResources(prev => prev.map(r => (r.id || r._id) === resId ? { ...r, isBookmarked: false } : r));
      showToast('Removed from saved library.', 'info');
    } catch (err) {
      showToast(err.message || 'Error removing bookmark', 'info');
    }
  };

  // Upvote Handler
  const handleUpvote = async (id) => {
    if (!currentUser) {
      handleOpenAuth('login');
      showToast('Please sign in to upvote materials.', 'info');
      return;
    }
    try {
      const res = await upvoteResource(id);
      setResources(prev => prev.map(r => {
        if ((r.id || r._id) === id) {
          return { ...r, upvotesCount: res.upvotesCount, hasUpvoted: res.hasUpvoted };
        }
        return r;
      }));
      if (selectedResource && (selectedResource.id || selectedResource._id) === id) {
        setSelectedResource(prev => ({ ...prev, upvotesCount: res.upvotesCount, hasUpvoted: res.hasUpvoted }));
      }
      if (res.hasUpvoted) {
        showToast('Upvoted! Thank you for supporting peer study materials.');
      }
    } catch (err) {
      console.error('Upvote error:', err);
    }
  };

  // Download Handler
  const handleDownload = async (id, fileUrl, filename) => {
    try {
      await recordDownload(id);
      setResources(prev => prev.map(r => {
        if ((r.id || r._id) === id) {
          return { ...r, downloadCount: (r.downloadCount || 0) + 1 };
        }
        return r;
      }));
      if (selectedResource && (selectedResource.id || selectedResource._id) === id) {
        setSelectedResource(prev => ({ ...prev, downloadCount: (prev.downloadCount || 0) + 1 }));
      }

      if (fileUrl) {
        const link = document.createElement('a');
        link.href = fileUrl;
        link.download = filename || 'resource.pdf';
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (err) {
      console.error('Download error:', err);
    }
  };

  // Delete Action Handlers (Strictly Authorized in MongoDB)
  const handlePromptDelete = (resource) => {
    if (!currentUser) {
      handleOpenAuth('login');
      return;
    }
    const currentUserId = currentUser.id || currentUser._id;
    const uploaderId = resource.uploader ? (resource.uploader._id || resource.uploader.id || resource.uploader) : null;
    if (String(currentUserId) !== String(uploaderId) && currentUser.role !== 'admin') {
      showToast('Unauthorized: You can only delete resources that you uploaded!', 'info');
      return;
    }
    setResourceToDelete(resource);
  };

  const handleConfirmDelete = async (resourceId) => {
    try {
      await deleteResource(resourceId);
      setResources(prev => prev.filter(r => (r.id || r._id) !== resourceId));
      setBookmarks(prev => prev.filter(b => (b.id || b._id) !== resourceId));
      if (selectedResource && (selectedResource.id || selectedResource._id) === resourceId) {
        setSelectedResource(null);
      }
      showToast('Resource deleted permanently from StudyShare.');
      fetchStats().then(s => s.data && setStats(s.data));
    } catch (err) {
      showToast(err.message || 'Failed to delete resource', 'info');
    }
  };

  // Filter My Uploads Toggle
  const handleFilterMyUploads = () => {
    if (!currentUser) {
      handleOpenAuth('login');
      return;
    }
    setCurrentTab('repository');
    setIsMyUploadsActive(prev => !prev);
  };

  const handleResetFilters = () => {
    setSelectedDepartment('ALL');
    setSelectedSemester('ALL');
    setSelectedSubject('ALL');
    setSelectedCategory('ALL');
    setSortBy('newest');
    setSearchTerm('');
    setIsMyUploadsActive(false);
  };

  // If session is still verifying on initial page load
  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center text-xs font-semibold text-slate-500 font-['Plus_Jakarta_Sans',sans-serif]">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <span>Verifying StudyShare session...</span>
        </div>
      </div>
    );
  }

  // First show login page if not authenticated
  if (!currentUser) {
    return (
      <div className="relative font-['Plus_Jakarta_Sans',sans-serif]">
        {toast && (
          <div className="fixed bottom-5 right-5 z-50">
            <div className={`px-4 py-2.5 rounded-xl shadow-lg flex items-center gap-2 text-xs font-semibold border ${
              toast.type === 'info'
                ? 'bg-slate-900 text-white border-slate-800'
                : 'bg-emerald-600 text-white border-emerald-500'
            }`}>
              {toast.type === 'info' ? (
                <AlertCircle className="w-4 h-4 shrink-0 text-amber-300" />
              ) : (
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-200" />
              )}
              <span>{toast.message}</span>
            </div>
          </div>
        )}
        <LoginPage
          onAuthSuccess={handleAuthSuccess}
          departments={departments}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800 antialiased font-['Plus_Jakarta_Sans',sans-serif]">
      
      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50">
          <div className={`px-4 py-2.5 rounded-xl shadow-lg flex items-center gap-2 text-xs font-semibold border ${
            toast.type === 'info'
              ? 'bg-slate-900 text-white border-slate-800'
              : 'bg-emerald-700 text-white border-emerald-600'
          }`}>
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      {/* Top Navigation */}
      <Navbar
        currentTab={currentTab}
        setCurrentTab={(tab) => {
          setCurrentTab(tab);
          if (tab === 'requests') setIsRequestsOpen(true);
          if (tab === 'bookmarks') setIsBookmarksOpen(true);
        }}
        onOpenUpload={() => setIsUploadOpen(true)}
        onOpenAuth={handleOpenAuth}
        currentUser={currentUser}
        onLogout={handleLogout}
        onOpenProfile={() => setIsProfileOpen(true)}
        bookmarksCount={bookmarks.length}
        requestCount={requests.filter(r => r.status === 'Open').length}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        onFilterMyUploads={handleFilterMyUploads}
        isMyUploadsActive={isMyUploadsActive}
      />

      {/* Hero / Header */}
      <Hero
        stats={stats}
        onQuickCategory={(cat) => {
          setSelectedCategory(cat);
          setIsMyUploadsActive(false);
        }}
        activeCategory={selectedCategory}
        onOpenRequests={() => setIsRequestsOpen(true)}
        currentUser={currentUser}
        onOpenUpload={() => setIsUploadOpen(true)}
      />

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 flex-1 w-full">
        
        {/* Dynamic Filters Bar */}
        <FilterBar
          departments={departments}
          selectedDepartment={selectedDepartment}
          setSelectedDepartment={setSelectedDepartment}
          selectedSemester={selectedSemester}
          setSelectedSemester={setSelectedSemester}
          selectedSubject={selectedSubject}
          setSelectedSubject={setSelectedSubject}
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
          sortBy={sortBy}
          setSortBy={setSortBy}
          onResetFilters={handleResetFilters}
        />

        {/* Resources Section Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <h2 className="text-sm sm:text-base font-bold text-slate-900">
              {isMyUploadsActive ? 'My Uploaded Course Materials' : 'Academic Materials'}
            </h2>
            <span className="text-xs bg-slate-200/70 text-slate-700 font-semibold px-2 py-0.5 rounded-full">
              {resources.length}
            </span>
            {isMyUploadsActive && (
              <span className="text-xs text-indigo-700 bg-indigo-50 border border-indigo-200 font-bold px-2 py-0.5 rounded">
                Filtered: Uploaded by you (delete active)
              </span>
            )}
          </div>

          <div className="flex items-center gap-3 text-xs">
            {isMyUploadsActive && (
              <button
                onClick={() => setIsMyUploadsActive(false)}
                className="text-slate-500 hover:text-slate-900 underline font-semibold"
              >
                View all materials
              </button>
            )}

            <button
              onClick={() => {
                if (!currentUser) handleOpenAuth('login');
                else setIsUploadOpen(true);
              }}
              className="text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1 hover:underline"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Publish note</span>
            </button>
          </div>
        </div>

        {/* Resource Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map(n => (
              <div key={n} className="bg-white rounded-xl p-4 border border-slate-200 animate-pulse space-y-3">
                <div className="h-3.5 bg-slate-200 rounded w-1/3"></div>
                <div className="h-5 bg-slate-200 rounded w-3/4"></div>
                <div className="h-3 bg-slate-100 rounded w-1/2"></div>
                <div className="h-8 bg-slate-100 rounded"></div>
              </div>
            ))}
          </div>
        ) : resources.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {resources.map((res) => {
              const resId = res.id || res._id;
              const isSaved = bookmarks.some(b => (b.id || b._id) === resId);
              return (
                <ResourceCard
                  key={resId}
                  resource={res}
                  currentUser={currentUser}
                  onSelect={(r) => setSelectedResource(r)}
                  onUpvote={handleUpvote}
                  onDownload={handleDownload}
                  onDelete={handlePromptDelete}
                  isBookmarked={isSaved}
                  onToggleBookmark={handleToggleBookmark}
                />
              );
            })}
          </div>
        ) : (
          /* Clean Empty State */
          <div className="bg-white rounded-xl border border-slate-200 p-10 text-center max-w-md mx-auto space-y-3 my-6 text-xs">
            <div className="w-10 h-10 bg-slate-100 text-slate-500 rounded-xl flex items-center justify-center mx-auto">
              <FileSearch className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-sm">
                {isMyUploadsActive ? "You haven't uploaded any study materials yet" : "No materials match your criteria"}
              </h3>
              <p className="text-slate-500 mt-1">
                {isMyUploadsActive 
                  ? "Share lecture notes, question papers, or practical manuals with peers." 
                  : "Try clearing your filters or search keywords to view all uploaded materials."}
              </p>
            </div>
            <div className="pt-1 flex items-center justify-center gap-2">
              <button
                onClick={handleResetFilters}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg"
              >
                Reset Filters
              </button>
              <button
                onClick={() => {
                  if (!currentUser) handleOpenAuth('login');
                  else setIsUploadOpen(true);
                }}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg shadow-2xs"
              >
                Upload First Note
              </button>
            </div>
          </div>
        )}

      </main>

      {/* Modals */}
      {selectedResource && (
        <ResourceModal
          resource={selectedResource}
          currentUser={currentUser}
          onClose={() => setSelectedResource(null)}
          onUpvote={handleUpvote}
          onDownload={handleDownload}
          onDelete={handlePromptDelete}
          isBookmarked={bookmarks.some(b => (b.id || b._id) === (selectedResource.id || selectedResource._id))}
          onToggleBookmark={handleToggleBookmark}
        />
      )}

      <UploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        departments={departments}
        currentUser={currentUser}
        onUploadSuccess={(newRes) => {
          setResources(prev => [newRes, ...prev]);
          showToast('Resource uploaded and stored in MongoDB successfully.');
          fetchStats().then(s => s.data && setStats(s.data));
        }}
      />

      <RequestsBoardModal
        isOpen={isRequestsOpen}
        onClose={() => setIsRequestsOpen(false)}
        currentUser={currentUser}
        departments={departments}
        onOpenAuth={handleOpenAuth}
      />

      <BookmarksDrawer
        isOpen={isBookmarksOpen}
        onClose={() => setIsBookmarksOpen(false)}
        bookmarks={bookmarks}
        onRemoveBookmark={handleRemoveBookmark}
        onSelectResource={(r) => setSelectedResource(r)}
        onDownload={handleDownload}
      />

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onAuthSuccess={handleAuthSuccess}
        initialMode={authMode}
        departments={departments}
      />

      <ProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        currentUser={currentUser}
        onProfileUpdated={(updatedUser) => {
          setCurrentUser(updatedUser);
          showToast('Profile updated.');
        }}
      />

      <DeleteConfirmModal
        isOpen={!!resourceToDelete}
        onClose={() => setResourceToDelete(null)}
        resource={resourceToDelete}
        onConfirmDelete={handleConfirmDelete}
      />

      {/* Footer */}
      <Footer />

    </div>
  );
}
