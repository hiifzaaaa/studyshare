import React, { useState, useEffect } from 'react';
import { 
  X, 
  Download, 
  ExternalLink, 
  ThumbsUp, 
  Star, 
  Bookmark, 
  User, 
  FileText, 
  MessageSquare, 
  Send, 
  Eye, 
  Trash2,
  Calendar,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import { fetchReviews, addReview, deleteReview, resolveFileUrl } from '../services/api';

export default function ResourceModal({
  resource,
  currentUser,
  onClose,
  onUpvote,
  onDownload,
  onDelete,
  isBookmarked,
  onToggleBookmark
}) {
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'preview' | 'reviews'
  const [reviews, setReviews] = useState([]);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const currentUserId = currentUser ? (currentUser.id || currentUser._id) : null;
  const uploaderId = resource.uploader ? (resource.uploader._id || resource.uploader.id || resource.uploader) : null;
  const isOwner = currentUserId && uploaderId && (String(currentUserId) === String(uploaderId));

  const resourceId = resource.id || resource._id;

  // Load reviews from MongoDB
  useEffect(() => {
    if (resourceId) {
      fetchReviews(resourceId)
        .then(res => {
          if (res.data) setReviews(res.data);
        })
        .catch(err => console.error('Failed to load reviews:', err));
    }
  }, [resourceId]);

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!currentUser) {
      setErrorMsg('Please sign in to leave a review.');
      return;
    }
    if (!comment.trim()) return;

    try {
      setIsSubmitting(true);
      setErrorMsg('');
      const res = await addReview(resourceId, { rating, comment });
      setReviews(prev => [res.data, ...prev]);
      setComment('');
      setSuccessMsg('Review submitted successfully.');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to submit review.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteReview = async (reviewId) => {
    try {
      await deleteReview(reviewId);
      setReviews(prev => prev.filter(r => r._id !== reviewId));
    } catch (err) {
      alert(err.message || 'Failed to delete review');
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div 
        className="relative bg-white rounded-2xl shadow-xl max-w-2xl w-full border border-slate-200 overflow-hidden text-xs"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-100 flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-1.5 flex-wrap mb-1.5">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-100 uppercase">
                {resource.category}
              </span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                {resource.department} • Semester {resource.semester}
              </span>
              {resource.examType && resource.examType !== 'General' && (
                <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-slate-50 text-slate-500 border border-slate-200">
                  {resource.examType}
                </span>
              )}
              {isOwner && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-600 text-white">
                  Uploaded by You
                </span>
              )}
            </div>

            <h2 className="text-base font-bold text-slate-900 leading-snug">
              {resource.title}
            </h2>

            <div className="mt-1 flex items-center gap-2 text-[11px] text-slate-500 flex-wrap">
              <span className="font-semibold text-slate-700">{resource.subject}</span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <User className="w-3 h-3 text-slate-400" />
                {resource.uploaderName || 'Student'}
              </span>
              <span>•</span>
              <span>{new Date(resource.createdAt).toLocaleDateString()}</span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-700 rounded-md transition-colors shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tabs Bar */}
        <div className="px-5 border-b border-slate-100 flex items-center gap-5 font-semibold text-slate-500 bg-slate-50/50">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-2.5 border-b-2 transition-colors ${
              activeTab === 'overview'
                ? 'border-indigo-600 text-indigo-600 font-bold'
                : 'border-transparent hover:text-slate-800'
            }`}
          >
            Overview
          </button>

          {resource.type === 'file' && resource.fileUrl && (
            <button
              onClick={() => setActiveTab('preview')}
              className={`py-2.5 border-b-2 flex items-center gap-1.5 transition-colors ${
                activeTab === 'preview'
                  ? 'border-indigo-600 text-indigo-600 font-bold'
                  : 'border-transparent hover:text-slate-800'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Preview</span>
            </button>
          )}

          <button
            onClick={() => setActiveTab('reviews')}
            className={`py-2.5 border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === 'reviews'
                ? 'border-indigo-600 text-indigo-600 font-bold'
                : 'border-transparent hover:text-slate-800'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Reviews ({reviews.length})</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 max-h-[60vh] overflow-y-auto space-y-4">
          
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-4">
              <div>
                <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Description
                </h4>
                <p className="text-slate-700 leading-relaxed whitespace-pre-line">
                  {resource.description || 'No detailed description provided for this academic resource.'}
                </p>
              </div>

              {/* Tags */}
              {resource.tags && resource.tags.length > 0 && (
                <div>
                  <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    Topics
                  </h4>
                  <div className="flex flex-wrap gap-1">
                    {resource.tags.map((t, idx) => (
                      <span key={idx} className="bg-slate-100 text-slate-600 font-medium px-2 py-0.5 rounded border border-slate-200">
                        #{t}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* File Info Box */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-800 truncate max-w-xs">
                      {resource.originalFilename || resource.title}
                    </p>
                    <p className="text-[11px] text-slate-400">
                      {resource.type === 'link' ? 'Curated External URL' : `${Math.round(resource.fileSize / 1024)} KB`}
                    </p>
                  </div>
                </div>

                {resource.type === 'link' ? (
                  <a
                    href={resource.linkUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => onDownload(resourceId)}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold flex items-center gap-1 transition-colors"
                  >
                    <span>Visit Link</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                ) : (
                  <button
                    onClick={() => onDownload(resourceId, resource.fileUrl, resource.originalFilename)}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold flex items-center gap-1 transition-colors shadow-2xs"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download</span>
                  </button>
                )}
              </div>

              {/* Quick Metrics */}
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-2.5 rounded-lg border border-slate-100 bg-slate-50">
                  <p className="text-base font-bold text-slate-900">{resource.downloadCount || 0}</p>
                  <p className="text-[10px] text-slate-400">Downloads</p>
                </div>
                <div className="p-2.5 rounded-lg border border-slate-100 bg-slate-50">
                  <p className="text-base font-bold text-indigo-600">{resource.upvotesCount || (resource.upvotes ? resource.upvotes.length : 0)}</p>
                  <p className="text-[10px] text-slate-400">Peer Upvotes</p>
                </div>
                <div className="p-2.5 rounded-lg border border-slate-100 bg-slate-50">
                  <p className="text-base font-bold text-amber-500">★ {resource.averageRating ? resource.averageRating.toFixed(1) : '5.0'}</p>
                  <p className="text-[10px] text-slate-400">Average Rating</p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: PREVIEW */}
          {activeTab === 'preview' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-slate-500">
                <span>PDF Document Preview</span>
                <a
                  href={resolveFileUrl(resource.fileUrl)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-indigo-600 hover:underline flex items-center gap-1 font-semibold"
                >
                  <span>Open in Full Tab</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <div className="w-full h-80 rounded-xl border border-slate-200 overflow-hidden bg-slate-100">
                <iframe
                  src={resolveFileUrl(resource.fileUrl)}
                  title="Document Preview"
                  className="w-full h-full"
                />
              </div>
            </div>
          )}

          {/* TAB 3: REVIEWS */}
          {activeTab === 'reviews' && (
            <div className="space-y-4">
              
              {/* Review Submission Form */}
              <form onSubmit={handleSubmitReview} className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800">Rate this study material</span>
                  
                  {/* Star Selector */}
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        className="p-0.5 focus:outline-none"
                      >
                        <Star
                          className={`w-4 h-4 ${
                            rating >= star ? 'fill-amber-400 text-amber-400' : 'text-slate-300'
                          }`}
                        />
                      </button>
                    ))}
                    <span className="text-[11px] font-semibold text-slate-500 ml-1">
                      {rating}/5
                    </span>
                  </div>
                </div>

                {errorMsg && (
                  <p className="text-rose-600 text-[11px] font-medium flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    <span>{errorMsg}</span>
                  </p>
                )}

                {successMsg && (
                  <p className="text-emerald-600 text-[11px] font-medium flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>{successMsg}</span>
                  </p>
                )}

                <textarea
                  rows={2}
                  placeholder="How did this resource help? E.g. 'Unit 3 graph algorithms were explained clearly.'"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-indigo-500"
                  required
                />

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white font-bold rounded-lg transition-colors flex items-center gap-1 shadow-2xs"
                  >
                    <Send className="w-3 h-3" />
                    <span>{isSubmitting ? 'Submitting...' : 'Post Review'}</span>
                  </button>
                </div>
              </form>

              {/* Reviews List */}
              <div className="space-y-2">
                {reviews.length > 0 ? (
                  reviews.map((rev) => {
                    const isReviewAuthor = currentUserId && rev.user && (String(currentUserId) === String(rev.user._id || rev.user.id || rev.user));
                    return (
                      <div key={rev._id} className="p-3 bg-white rounded-lg border border-slate-100">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-800">
                              {rev.user ? rev.user.fullName : 'Verified Student'}
                            </span>
                            <div className="flex items-center text-amber-400">
                              {[...Array(rev.rating)].map((_, i) => (
                                <Star key={i} className="w-2.5 h-2.5 fill-amber-400" />
                              ))}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 text-[10px] text-slate-400">
                            <span>{new Date(rev.createdAt).toLocaleDateString()}</span>
                            {isReviewAuthor && (
                              <button
                                onClick={() => handleDeleteReview(rev._id)}
                                className="text-slate-400 hover:text-rose-600"
                                title="Delete your review"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        </div>

                        <p className="text-slate-600 leading-relaxed">
                          {rev.comment}
                        </p>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-center py-6 text-slate-400">
                    No reviews yet. Be the first student to review this material.
                  </p>
                )}
              </div>

            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-2">
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => onUpvote(resourceId)}
              className="flex items-center gap-1 px-2.5 py-1.5 bg-white border border-slate-200 hover:border-slate-300 text-slate-700 rounded-lg font-semibold transition-colors shadow-2xs"
            >
              <ThumbsUp className="w-3.5 h-3.5" />
              <span>Upvote ({resource.upvotesCount || (resource.upvotes ? resource.upvotes.length : 0)})</span>
            </button>

            <button
              onClick={() => onToggleBookmark(resource)}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg font-semibold transition-colors border shadow-2xs ${
                isBookmarked
                  ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <Bookmark className={`w-3.5 h-3.5 ${isBookmarked ? 'fill-indigo-600' : ''}`} />
              <span>{isBookmarked ? 'Saved' : 'Save'}</span>
            </button>

            {/* STRICT DELETE BUTTON (Visible only for file owner) */}
            {isOwner && (
              <button
                onClick={() => onDelete(resource)}
                className="flex items-center gap-1 px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg font-bold transition-colors"
                title="Delete this uploaded file permanently"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete</span>
              </button>
            )}
          </div>

          <div>
            {resource.type === 'link' ? (
              <a
                href={resource.linkUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => onDownload(resourceId)}
                className="flex items-center gap-1 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold shadow-xs transition-colors"
              >
                <span>Visit URL</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            ) : (
              <button
                onClick={() => onDownload(resourceId, resource.fileUrl, resource.originalFilename)}
                className="flex items-center gap-1 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-bold shadow-xs transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download File</span>
              </button>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}
