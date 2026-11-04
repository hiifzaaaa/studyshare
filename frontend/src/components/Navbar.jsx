import React, { useState, useRef, useEffect } from 'react';
import { 
  BookOpen, 
  Upload, 
  Bookmark, 
  HelpCircle, 
  Search, 
  User, 
  LogOut, 
  ChevronDown,
  FileText,
  SlidersHorizontal,
  FolderOpen
} from 'lucide-react';

export default function Navbar({ 
  currentTab,
  setCurrentTab,
  onOpenUpload, 
  onOpenAuth,
  currentUser,
  onLogout,
  onOpenProfile,
  bookmarksCount = 0, 
  requestCount = 0,
  searchTerm,
  setSearchTerm,
  onFilterMyUploads,
  isMyUploadsActive
}) {
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-15 gap-4">
          
          {/* Brand */}
          <div className="flex items-center gap-6">
            <button 
              onClick={() => { setCurrentTab('repository'); }}
              className="flex items-center gap-2.5 text-left focus:outline-none"
            >
              <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-xs">
                <BookOpen className="w-4 h-4" />
              </div>
              <div>
                <span className="font-bold text-base tracking-tight text-slate-900">
                  Study<span className="text-indigo-600">Share</span>
                </span>
                <span className="hidden sm:inline-block ml-2 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                  Academic Platform
                </span>
              </div>
            </button>

            {/* Navigation Tabs */}
            <nav className="hidden md:flex items-center gap-1 text-xs font-semibold text-slate-600">
              <button
                onClick={() => setCurrentTab('repository')}
                className={`px-3 py-1.5 rounded-lg transition-colors ${
                  currentTab === 'repository' && !isMyUploadsActive
                    ? 'text-indigo-600 bg-indigo-50 font-bold'
                    : 'hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                Materials
              </button>

              <button
                onClick={() => setCurrentTab('requests')}
                className={`relative px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
                  currentTab === 'requests'
                    ? 'text-indigo-600 bg-indigo-50 font-bold'
                    : 'hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <span>Requests</span>
                {requestCount > 0 && (
                  <span className="bg-amber-100 text-amber-800 text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                    {requestCount}
                  </span>
                )}
              </button>

              <button
                onClick={() => {
                  if (!currentUser) {
                    onOpenAuth('login');
                  } else {
                    setCurrentTab('bookmarks');
                  }
                }}
                className={`relative px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
                  currentTab === 'bookmarks'
                    ? 'text-indigo-600 bg-indigo-50 font-bold'
                    : 'hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <span>Saved Library</span>
                {bookmarksCount > 0 && (
                  <span className="bg-indigo-100 text-indigo-800 text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                    {bookmarksCount}
                  </span>
                )}
              </button>
            </nav>
          </div>

          {/* Quick Search */}
          <div className="flex-1 max-w-sm hidden sm:block">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Search notes, PYQs, subjects..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
              />
            </div>
          </div>

          {/* Actions & User State */}
          <div className="flex items-center gap-2.5">
            
            {/* Upload CTA */}
            <button
              onClick={() => {
                if (!currentUser) {
                  onOpenAuth('login');
                } else {
                  onOpenUpload();
                }
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Share Notes</span>
            </button>

            {/* Auth State */}
            {currentUser ? (
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 p-1.5 pl-2.5 pr-2 rounded-lg border border-slate-200 hover:border-slate-300 bg-slate-50 text-xs text-slate-700 transition-colors"
                >
                  <div className="w-5 h-5 rounded-full bg-indigo-600 text-white font-bold text-[10px] flex items-center justify-center">
                    {currentUser.fullName ? currentUser.fullName.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <span className="font-semibold text-slate-800 hidden md:inline truncate max-w-[100px]">
                    {currentUser.fullName.split(' ')[0]}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 mt-1.5 w-52 bg-white rounded-xl shadow-lg border border-slate-200 py-1.5 text-xs text-slate-700 z-50">
                    <div className="px-3.5 py-2 border-b border-slate-100">
                      <p className="font-bold text-slate-900 truncate">{currentUser.fullName}</p>
                      <p className="text-[11px] text-slate-500 truncate">@{currentUser.username}</p>
                      <span className="inline-block mt-1 text-[10px] font-semibold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-100">
                        {currentUser.department} • Semester {currentUser.semester}
                      </span>
                    </div>

                    <button
                      onClick={() => {
                        onFilterMyUploads();
                        setUserMenuOpen(false);
                      }}
                      className="w-full text-left px-3.5 py-2 hover:bg-slate-50 flex items-center gap-2 text-slate-700"
                    >
                      <FolderOpen className="w-3.5 h-3.5 text-slate-400" />
                      <span>My Uploaded Materials</span>
                    </button>

                    <button
                      onClick={() => {
                        setCurrentTab('bookmarks');
                        setUserMenuOpen(false);
                      }}
                      className="w-full text-left px-3.5 py-2 hover:bg-slate-50 flex items-center gap-2 text-slate-700"
                    >
                      <Bookmark className="w-3.5 h-3.5 text-slate-400" />
                      <span>Saved Revision Library</span>
                    </button>

                    <button
                      onClick={() => {
                        onOpenProfile();
                        setUserMenuOpen(false);
                      }}
                      className="w-full text-left px-3.5 py-2 hover:bg-slate-50 flex items-center gap-2 text-slate-700"
                    >
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      <span>Profile & Settings</span>
                    </button>

                    <div className="border-t border-slate-100 mt-1 pt-1">
                      <button
                        onClick={() => {
                          onLogout();
                          setUserMenuOpen(false);
                        }}
                        className="w-full text-left px-3.5 py-2 hover:bg-rose-50 text-rose-600 flex items-center gap-2 font-medium"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => onOpenAuth('login')}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-indigo-600 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Sign In
                </button>
                <button
                  onClick={() => onOpenAuth('register')}
                  className="px-3 py-1.5 text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg border border-indigo-200/80 transition-colors hidden sm:inline-block"
                >
                  Register
                </button>
              </div>
            )}

          </div>

        </div>
      </div>
    </header>
  );
}
