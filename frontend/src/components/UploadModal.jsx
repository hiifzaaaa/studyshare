import React, { useState, useEffect } from 'react';
import { 
  X, 
  Upload, 
  Link as LinkIcon, 
  FileText, 
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import { uploadResource } from '../services/api';

export default function UploadModal({ 
  isOpen, 
  onClose, 
  departments = [], 
  currentUser,
  onUploadSuccess 
}) {
  const [resourceType, setResourceType] = useState('file'); // 'file' | 'link'
  const [title, setTitle] = useState('');
  const [department, setDepartment] = useState('CSE');
  const [semester, setSemester] = useState('3');
  const [subject, setSubject] = useState('');
  const [customSubject, setCustomSubject] = useState('');
  const [category, setCategory] = useState('Notes');
  const [examType, setExamType] = useState('End-Semester');
  const [academicYear, setAcademicYear] = useState('2025-2026');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [file, setFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (currentUser && currentUser.department) {
      setDepartment(currentUser.department);
    }
  }, [currentUser]);

  if (!isOpen) return null;

  const currentDeptObj = departments.find(d => d.code === department);
  const availableSubjects = currentDeptObj ? currentDeptObj.subjects : [];

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      if (selected.size > 50 * 1024 * 1024) {
        setErrorMsg('File size exceeds the 50MB limit.');
        return;
      }
      setFile(selected);
      setErrorMsg('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    const finalSubject = subject === 'CUSTOM' || !subject ? customSubject : subject;

    if (!title.trim()) {
      setErrorMsg('Please enter a descriptive title for the resource.');
      return;
    }

    if (!finalSubject.trim()) {
      setErrorMsg('Please select or specify a subject.');
      return;
    }

    if (resourceType === 'file' && !file) {
      setErrorMsg('Please select a file to upload (PDF, DOCX, PPT, Image).');
      return;
    }

    if (resourceType === 'link' && (!linkUrl.trim() || !linkUrl.startsWith('http'))) {
      setErrorMsg('Please enter a valid URL starting with http:// or https://');
      return;
    }

    try {
      setIsSubmitting(true);
      const formData = new FormData();
      formData.append('title', title.trim());
      formData.append('department', department);
      formData.append('semester', semester);
      formData.append('subject', finalSubject.trim());
      formData.append('category', category);
      formData.append('examType', examType);
      formData.append('academicYear', academicYear);
      formData.append('description', description.trim());
      formData.append('tags', tags);
      formData.append('type', resourceType);

      if (resourceType === 'file' && file) {
        formData.append('file', file);
      } else {
        formData.append('linkUrl', linkUrl.trim());
      }

      const res = await uploadResource(formData);
      if (onUploadSuccess) {
        onUploadSuccess(res.data);
      }
      onClose();
    } catch (err) {
      setErrorMsg(err.message || 'Failed to upload resource.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div 
        className="relative bg-white rounded-2xl shadow-xl max-w-xl w-full border border-slate-200 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Share Academic Resource</h2>
            <p className="text-xs text-slate-500">
              Publish course materials to the university repository
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-700 rounded-md transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Source Mode Toggle */}
        <div className="flex border-b border-slate-100 bg-slate-50/50 p-1 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setResourceType('file')}
            className={`flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-colors ${
              resourceType === 'file'
                ? 'bg-white text-indigo-600 shadow-2xs font-bold'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Upload Document</span>
          </button>

          <button
            type="button"
            onClick={() => setResourceType('link')}
            className={`flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-colors ${
              resourceType === 'link'
                ? 'bg-white text-indigo-600 shadow-2xs font-bold'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <LinkIcon className="w-3.5 h-3.5" />
            <span>Curated Web Link</span>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-3.5 max-h-[75vh] overflow-y-auto text-xs">
          
          {errorMsg && (
            <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Resource Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Operating Systems Unit 3 Process Scheduling & Banker's Algorithm"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Department, Semester, Category */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Department <span className="text-rose-500">*</span>
              </label>
              <select
                value={department}
                onChange={(e) => {
                  setDepartment(e.target.value);
                  setSubject('');
                }}
                className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg"
              >
                {['CSE', 'AIDS', 'IT', 'ECE', 'MECH', 'CIVIL', 'EE', 'GEN'].map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Semester <span className="text-rose-500">*</span>
              </label>
              <select
                value={semester}
                onChange={(e) => setSemester(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8].map(s => (
                  <option key={s} value={s}>Semester {s}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Category <span className="text-rose-500">*</span>
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg"
              >
                <option value="Notes">Lecture Notes</option>
                <option value="PYQ">Question Paper (PYQ)</option>
                <option value="Lab">Lab Manual</option>
                <option value="Book">Formula Sheet</option>
                <option value="Link">Curated Link</option>
                <option value="Syllabus">Curriculum / Syllabus</option>
              </select>
            </div>
          </div>

          {/* Subject */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Subject <span className="text-rose-500">*</span>
              </label>
              <select
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg"
              >
                <option value="">-- Choose Subject --</option>
                {availableSubjects.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
                <option value="CUSTOM">+ Specify Other Subject</option>
              </select>
            </div>

            {(subject === 'CUSTOM' || availableSubjects.length === 0 || !subject) && (
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Custom Subject Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Cloud Security"
                  value={customSubject}
                  onChange={(e) => setCustomSubject(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg"
                />
              </div>
            )}
          </div>

          {/* File Upload Zone OR Link */}
          {resourceType === 'file' ? (
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Document File (PDF, Word, PPT, Image, ZIP) <span className="text-rose-500">*</span>
              </label>
              <div className="border border-dashed border-slate-300 hover:border-indigo-500 rounded-xl p-4 text-center bg-slate-50/50 transition-colors">
                <input
                  type="file"
                  id="fileUpload"
                  onChange={handleFileChange}
                  accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,.zip,.png,.jpg,.jpeg"
                  className="hidden"
                />
                <label htmlFor="fileUpload" className="cursor-pointer block">
                  <Upload className="w-5 h-5 text-slate-400 mx-auto mb-1.5" />
                  {file ? (
                    <div>
                      <p className="font-bold text-slate-800 truncate">{file.name}</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {Math.round(file.size / 1024)} KB • Click to change file
                      </p>
                    </div>
                  ) : (
                    <div>
                      <p className="font-semibold text-slate-700">Click to select document</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">PDF, DOC, PPT up to 50MB</p>
                    </div>
                  )}
                </label>
              </div>
            </div>
          ) : (
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Resource URL <span className="text-rose-500">*</span>
              </label>
              <input
                type="url"
                placeholder="https://drive.google.com/... or https://notion.so/..."
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-indigo-500"
              />
            </div>
          )}

          {/* Description */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Description & Topics Covered
            </label>
            <textarea
              rows={2}
              placeholder="Summary of units, chapters, or questions included in this resource..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Tags */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Topic Tags (comma-separated)
            </label>
            <input
              type="text"
              placeholder="e.g. Banker's Algorithm, Deadlocks, Paging, Hand-written"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Actions */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-800 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 shadow-xs"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Uploading...' : 'Publish Material'}</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
