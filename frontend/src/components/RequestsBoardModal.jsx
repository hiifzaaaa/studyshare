import React, { useState, useEffect } from 'react';
import { 
  X, 
  HelpCircle, 
  Plus, 
  CheckCircle2, 
  Trash2, 
  AlertCircle,
  Clock,
  Layers
} from 'lucide-react';
import { fetchRequests, createRequest, deleteRequest, fulfillRequest } from '../services/api';

export default function RequestsBoardModal({
  isOpen,
  onClose,
  currentUser,
  departments = [],
  onOpenAuth
}) {
  const [requests, setRequests] = useState([]);
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [showNewForm, setShowNewForm] = useState(false);
  const [loading, setLoading] = useState(true);

  // Form states
  const [title, setTitle] = useState('');
  const [department, setDepartment] = useState('CSE');
  const [semester, setSemester] = useState('3');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [urgency, setUrgency] = useState('Medium');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const currentUserId = currentUser ? (currentUser.id || currentUser._id) : null;

  const loadRequests = async () => {
    try {
      setLoading(true);
      const res = await fetchRequests();
      if (res.data) setRequests(res.data);
    } catch (err) {
      console.error('Failed to load requests:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadRequests();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCreateRequest = async (e) => {
    e.preventDefault();
    if (!currentUser) {
      onOpenAuth('login');
      return;
    }
    if (!title.trim() || !subject.trim()) {
      setErrorMsg('Please specify both the request title and subject name.');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMsg('');
      const res = await createRequest({
        title: title.trim(),
        department,
        semester: Number(semester),
        subject: subject.trim(),
        description: description.trim(),
        urgency
      });
      setRequests(prev => [res.data, ...prev]);
      setShowNewForm(false);
      setTitle('');
      setDescription('');
      setSubject('');
    } catch (err) {
      setErrorMsg(err.message || 'Failed to submit request.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFulfill = async (id) => {
    if (!currentUser) {
      onOpenAuth('login');
      return;
    }
    try {
      const res = await fulfillRequest(id);
      setRequests(prev => prev.map(r => r.id === id || r._id === id ? res.data : r));
    } catch (err) {
      alert(err.message || 'Error updating request');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this request?')) return;
    try {
      await deleteRequest(id);
      setRequests(prev => prev.filter(r => r.id !== id && r._id !== id));
    } catch (err) {
      alert(err.message || 'Error deleting request');
    }
  };

  const filtered = requests.filter(r => {
    if (filterStatus === 'ALL') return true;
    return r.status === filterStatus;
  });

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 text-xs">
      <div 
        className="relative bg-white rounded-2xl shadow-xl max-w-2xl w-full border border-slate-200 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
              <HelpCircle className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Community Resource Requests</h2>
              <p className="text-[11px] text-slate-500">
                Ask peers and seniors for missing question papers, unit notes, or lab manuals
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-700 rounded-md transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Action / Filter Bar */}
        <div className="px-5 py-2.5 bg-slate-50 border-b border-slate-100 flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-1">
            <button
              onClick={() => setFilterStatus('ALL')}
              className={`px-2.5 py-1 rounded text-xs font-semibold transition-colors ${
                filterStatus === 'ALL' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-200/60'
              }`}
            >
              All ({requests.length})
            </button>
            <button
              onClick={() => setFilterStatus('Open')}
              className={`px-2.5 py-1 rounded text-xs font-semibold transition-colors ${
                filterStatus === 'Open' ? 'bg-amber-600 text-white' : 'text-slate-600 hover:bg-slate-200/60'
              }`}
            >
              Open
            </button>
            <button
              onClick={() => setFilterStatus('Fulfilled')}
              className={`px-2.5 py-1 rounded text-xs font-semibold transition-colors ${
                filterStatus === 'Fulfilled' ? 'bg-emerald-600 text-white' : 'text-slate-600 hover:bg-slate-200/60'
              }`}
            >
              Fulfilled
            </button>
          </div>

          <button
            onClick={() => {
              if (!currentUser) {
                onOpenAuth('login');
              } else {
                setShowNewForm(!showNewForm);
              }
            }}
            className="flex items-center gap-1 px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold shadow-2xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{showNewForm ? 'View List' : 'Request Material'}</span>
          </button>
        </div>

        {/* Content Area */}
        <div className="p-5 max-h-[60vh] overflow-y-auto space-y-3">
          
          {showNewForm ? (
            /* CREATE REQUEST FORM */
            <form onSubmit={handleCreateRequest} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
              <h3 className="font-bold text-slate-800 text-sm">Post a New Material Request</h3>

              {errorMsg && (
                <div className="p-2 rounded bg-rose-50 border border-rose-200 text-rose-700">
                  {errorMsg}
                </div>
              )}

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  What study material do you need? <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Need 2024 End-Sem Operating Systems Solved Paper"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
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
                    onChange={(e) => setSemester(e.target.value)}
                    className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(s => (
                      <option key={s} value={s}>Sem {s}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Urgency</label>
                  <select
                    value={urgency}
                    onChange={(e) => setUrgency(e.target.value)}
                    className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg"
                  >
                    <option value="High">High (Exam near)</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Subject Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Operating Systems"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Specifics / Details</label>
                <textarea
                  rows={2}
                  placeholder="Specify units or exact questions (e.g. 'Looking especially for Banker's algorithm and Disk scheduling solutions')..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowNewForm(false)}
                  className="px-3 py-1 text-slate-600 hover:text-slate-800 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white font-bold rounded-lg shadow-2xs"
                >
                  {isSubmitting ? 'Posting...' : 'Post Request'}
                </button>
              </div>
            </form>
          ) : (
            /* LIST OF REQUESTS */
            filtered.length > 0 ? (
              filtered.map((req) => {
                const reqUserId = req.requester ? (req.requester._id || req.requester.id || req.requester) : null;
                const isRequester = currentUserId && reqUserId && (String(currentUserId) === String(reqUserId));
                return (
                  <div 
                    key={req.id || req._id}
                    className="p-3.5 bg-white rounded-xl border border-slate-200 hover:border-slate-300 transition-colors space-y-1.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                          req.status === 'Fulfilled'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}>
                          {req.status === 'Fulfilled' ? '✓ Fulfilled' : '● Open Request'}
                        </span>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                          {req.department} • Sem {req.semester}
                        </span>
                        {req.urgency === 'High' && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200">
                            Urgent
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1">
                        {req.status === 'Open' && (
                          <button
                            onClick={() => handleFulfill(req.id || req._id)}
                            className="px-2 py-0.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded text-[11px] font-bold transition-colors"
                            title="Mark as fulfilled"
                          >
                            Mark Fulfilled
                          </button>
                        )}
                        {isRequester && (
                          <button
                            onClick={() => handleDelete(req.id || req._id)}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded"
                            title="Delete your request"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    <h4 className="font-bold text-slate-900 text-xs sm:text-sm">
                      {req.title}
                    </h4>

                    {req.description && (
                      <p className="text-slate-500 text-xs leading-relaxed">
                        {req.description}
                      </p>
                    )}

                    <div className="flex items-center gap-3 text-[11px] text-slate-400 pt-1 border-t border-slate-100">
                      <span className="font-semibold text-slate-600">{req.subject}</span>
                      <span>•</span>
                      <span>Requested by {req.requesterName || (req.requester && req.requester.fullName) || 'Student'}</span>
                      <span>•</span>
                      <span>{new Date(req.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-center py-8 text-slate-400">
                No requests currently found in this category.
              </p>
            )
          )}

        </div>

      </div>
    </div>
  );
}
