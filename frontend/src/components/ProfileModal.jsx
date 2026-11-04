import React, { useState } from 'react';
import { 
  X, 
  User, 
  Mail, 
  GraduationCap, 
  Calendar, 
  Edit3, 
  Save, 
  CheckCircle2, 
  AlertCircle 
} from 'lucide-react';
import { updateProfile } from '../services/api';

export default function ProfileModal({
  isOpen,
  onClose,
  currentUser,
  onProfileUpdated
}) {
  const [fullName, setFullName] = useState(currentUser ? currentUser.fullName : '');
  const [department, setDepartment] = useState(currentUser ? currentUser.department : 'CSE');
  const [semester, setSemester] = useState(currentUser ? currentUser.semester : 1);
  const [bio, setBio] = useState(currentUser ? currentUser.bio || '' : '');
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen || !currentUser) return null;

  const handleSave = async (e) => {
    e.preventDefault();
    if (!fullName.trim()) {
      setErrorMsg('Full name cannot be empty.');
      return;
    }

    try {
      setLoading(true);
      setErrorMsg('');
      const res = await updateProfile({
        fullName: fullName.trim(),
        department,
        semester: Number(semester),
        bio: bio.trim()
      });
      onProfileUpdated(res.user);
      setIsEditing(false);
      setSuccessMsg('Profile updated successfully.');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to update profile.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 text-xs">
      <div 
        className="relative bg-white rounded-2xl shadow-xl max-w-md w-full border border-slate-200 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold">
              <User className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Student Profile</h2>
              <p className="text-[11px] text-slate-400">Account details and academic settings</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-700 rounded-md transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          
          {errorMsg && (
            <div className="p-2 rounded bg-rose-50 border border-rose-200 text-rose-700 flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-2 rounded bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Profile Overview Card */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-indigo-600 text-white font-bold text-base flex items-center justify-center shadow-xs">
              {currentUser.fullName ? currentUser.fullName.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-slate-900 text-sm truncate">{currentUser.fullName}</h3>
              <p className="text-slate-500 text-[11px] truncate">@{currentUser.username} • {currentUser.email}</p>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-indigo-100 text-indigo-700">
                  {currentUser.department}
                </span>
                <span className="text-[10px] font-medium px-1.5 py-0.2 rounded bg-slate-200 text-slate-700">
                  Semester {currentUser.semester}
                </span>
                <span className="text-[10px] font-medium text-slate-400 uppercase">
                  {currentUser.role}
                </span>
              </div>
            </div>
          </div>

          {/* Edit Form OR View Details */}
          {isEditing ? (
            <form onSubmit={handleSave} className="space-y-3 pt-1">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Department</label>
                  <select
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg"
                  >
                    {['CSE', 'AIDS', 'IT', 'ECE', 'MECH', 'CIVIL', 'EE', 'GEN'].map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Semester</label>
                  <select
                    value={semester}
                    onChange={(e) => setSemester(Number(e.target.value))}
                    className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(s => (
                      <option key={s} value={s}>Sem {s}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Bio / Academic Interests</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Preparing for GATE 2027 / Interested in Systems and Algorithms..."
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-800"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-3 py-1 text-slate-600 hover:text-slate-800 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg shadow-2xs flex items-center gap-1"
                >
                  <Save className="w-3 h-3" />
                  <span>{loading ? 'Saving...' : 'Save Changes'}</span>
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-3 pt-1">
              <div>
                <span className="text-[11px] font-semibold text-slate-400">Bio:</span>
                <p className="text-slate-700 mt-0.5">
                  {currentUser.bio || 'No bio added yet.'}
                </p>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <span className="text-[11px] text-slate-400">
                  Joined: {new Date(currentUser.createdAt || Date.now()).toLocaleDateString()}
                </span>
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-3 py-1 text-indigo-600 hover:bg-indigo-50 border border-indigo-200 rounded-lg font-bold flex items-center gap-1 transition-colors"
                >
                  <Edit3 className="w-3 h-3" />
                  <span>Edit Profile</span>
                </button>
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
