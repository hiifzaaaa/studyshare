import React from 'react';
import { BookOpen } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-white border-t border-slate-200 py-6 mt-12 text-xs text-slate-500">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-indigo-600 flex items-center justify-center text-white">
            <BookOpen className="w-3.5 h-3.5" />
          </div>
          <span className="font-bold text-slate-900">
            Study<span className="text-indigo-600">Share</span>
          </span>
          <span className="text-slate-400">• Academic Resource Repository</span>
        </div>

        <div className="flex items-center gap-4 text-slate-400 text-[11px]">
          <span>Organized by Department & Semester</span>
          <span>•</span>
          <span>MongoDB Persistent Storage</span>
          <span>•</span>
          <span>© {new Date().getFullYear()} StudyShare</span>
        </div>

      </div>
    </footer>
  );
}
