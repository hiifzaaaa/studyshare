import React from 'react';
import { 
  ArrowUpDown, 
  RotateCcw, 
  Layers, 
  Calendar, 
  Tag, 
  BookOpen 
} from 'lucide-react';

export default function FilterBar({
  departments,
  selectedDepartment,
  setSelectedDepartment,
  selectedSemester,
  setSelectedSemester,
  selectedSubject,
  setSelectedSubject,
  selectedCategory,
  setSelectedCategory,
  sortBy,
  setSortBy,
  onResetFilters
}) {
  const semesters = [
    { label: 'All Semesters', value: 'ALL' },
    { label: 'Sem 1', value: '1' },
    { label: 'Sem 2', value: '2' },
    { label: 'Sem 3', value: '3' },
    { label: 'Sem 4', value: '4' },
    { label: 'Sem 5', value: '5' },
    { label: 'Sem 6', value: '6' },
    { label: 'Sem 7', value: '7' },
    { label: 'Sem 8', value: '8' },
  ];

  const categories = [
    { label: 'All Categories', value: 'ALL' },
    { label: 'Lecture Notes', value: 'Notes' },
    { label: 'PYQ Papers', value: 'PYQ' },
    { label: 'Lab Manuals', value: 'Lab' },
    { label: 'Formula Sheets', value: 'Book' },
    { label: 'Curated Links', value: 'Link' },
  ];

  const currentDeptObj = departments.find(d => d.code === selectedDepartment);
  const availableSubjects = currentDeptObj ? currentDeptObj.subjects : [];

  const isFiltered = 
    selectedDepartment !== 'ALL' ||
    selectedSemester !== 'ALL' ||
    selectedSubject !== 'ALL' ||
    selectedCategory !== 'ALL' ||
    sortBy !== 'newest';

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 mb-6 shadow-2xs">
      
      {/* Top Row: Department Selector & Sort & Reset */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-1.5 overflow-x-auto py-0.5 max-w-full">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1">
            Department:
          </span>
          <button
            onClick={() => {
              setSelectedDepartment('ALL');
              setSelectedSubject('ALL');
            }}
            className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors shrink-0 ${
              selectedDepartment === 'ALL'
                ? 'bg-slate-900 text-white'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            All
          </button>
          {departments.map((dept) => {
            const isSelected = selectedDepartment === dept.code;
            return (
              <button
                key={dept.code}
                onClick={() => {
                  setSelectedDepartment(dept.code);
                  setSelectedSubject('ALL');
                }}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-colors shrink-0 ${
                  isSelected
                    ? 'bg-indigo-600 text-white font-semibold'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <span>{dept.code}</span>
                {dept.resourceCount > 0 && (
                  <span className={`text-[10px] px-1.5 rounded-full ${
                    isSelected ? 'bg-indigo-500 text-white' : 'bg-slate-200 text-slate-600'
                  }`}>
                    {dept.resourceCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-md text-xs py-1 px-2 text-slate-700 focus:outline-none focus:border-indigo-500"
            >
              <option value="newest">Newest First</option>
              <option value="popular">Most Popular</option>
              <option value="rating">Highest Rated</option>
              <option value="downloads">Most Downloaded</option>
              <option value="oldest">Oldest First</option>
            </select>
          </div>

          {isFiltered && (
            <button
              onClick={onResetFilters}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* Row 2: Semester & Categories & Dynamic Subject Dropdown */}
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        
        {/* Semester Pills */}
        <div className="flex items-center gap-1 overflow-x-auto py-0.5">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1">
            Semester:
          </span>
          {semesters.map((sem) => {
            const isSelected = selectedSemester === sem.value;
            return (
              <button
                key={sem.value}
                onClick={() => setSelectedSemester(sem.value)}
                className={`px-2 py-0.5 rounded text-xs transition-colors shrink-0 ${
                  isSelected
                    ? 'bg-slate-800 text-white font-medium'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {sem.label === 'All Semesters' ? 'All' : sem.label}
              </button>
            );
          })}
        </div>

        {/* Category & Subject Dropdowns */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Category Dropdown */}
          <div className="flex items-center gap-1">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-md text-xs py-1 px-2.5 text-slate-700 focus:outline-none focus:border-indigo-500"
            >
              {categories.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>

          {/* Dynamic Subject Dropdown */}
          <div className="flex items-center gap-1">
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-md text-xs py-1 px-2.5 text-slate-700 focus:outline-none focus:border-indigo-500 max-w-[200px]"
            >
              <option value="ALL">All Subjects</option>
              {availableSubjects.map((sub) => (
                <option key={sub} value={sub}>{sub}</option>
              ))}
            </select>
          </div>
        </div>

      </div>

    </div>
  );
}
