import React from 'react';
import { 
  FileText, 
  HelpCircle, 
  BookMarked,
  ArrowRight,
  Sparkles
} from 'lucide-react';

export default function Hero({ 
  stats, 
  onQuickCategory,
  activeCategory,
  onOpenRequests,
  currentUser,
  onOpenUpload
}) {
  const quickCategories = [
    { label: 'All', value: 'ALL' },
    { label: 'Lecture Notes', value: 'Notes' },
    { label: 'Solved PYQs', value: 'PYQ' },
    { label: 'Lab Manuals', value: 'Lab' },
    { label: 'Formula Sheets', value: 'Book' },
    { label: 'Curated Links', value: 'Link' },
  ];

  return (
    <div className="bg-white border-b border-slate-200 py-6 mb-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          {/* Welcome / Context */}
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                College Study Portal
              </span>
              {currentUser && (
                <span className="text-xs text-slate-500">
                  Welcome, <strong className="text-slate-800">{currentUser.fullName}</strong> ({currentUser.department})
                </span>
              )}
            </div>

            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Centralized Academic Materials
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5 max-w-2xl">
              Course notes, previous year question papers, and lab manuals organized by branch, semester, and subject.
            </p>
          </div>

          {/* Quick Metrics from MongoDB */}
          {stats && (
            <div className="flex items-center gap-4 sm:gap-6 border-t md:border-t-0 pt-3 md:pt-0 border-slate-100 text-xs text-slate-600 shrink-0">
              <div className="text-center md:text-right">
                <p className="text-lg font-bold text-slate-900 leading-none">{stats.totalResources || 0}</p>
                <p className="text-[11px] text-slate-400 mt-1">Resources</p>
              </div>
              <div className="h-6 w-px bg-slate-200"></div>
              <div className="text-center md:text-right">
                <p className="text-lg font-bold text-indigo-600 leading-none">{stats.totalDownloads || 0}</p>
                <p className="text-[11px] text-slate-400 mt-1">Downloads</p>
              </div>
              <div className="h-6 w-px bg-slate-200"></div>
              <div className="text-center md:text-right">
                <p className="text-lg font-bold text-slate-900 leading-none">{stats.departmentCount || 8}</p>
                <p className="text-[11px] text-slate-400 mt-1">Departments</p>
              </div>
            </div>
          )}

        </div>

        {/* Quick Category Bar */}
        <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs font-medium text-slate-400 mr-1">Categories:</span>
            {quickCategories.map((cat) => {
              const isActive = activeCategory === cat.value;
              return (
                <button
                  key={cat.value}
                  onClick={() => onQuickCategory(cat.value)}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                    isActive
                      ? 'bg-slate-900 text-white font-semibold'
                      : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200/80'
                  }`}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onOpenRequests}
              className="text-xs font-semibold text-slate-600 hover:text-indigo-600 flex items-center gap-1 hover:underline"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Looking for missing notes? Post on Request Board</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
