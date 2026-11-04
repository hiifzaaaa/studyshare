import React from 'react';
import { 
  FileText, 
  ExternalLink, 
  Download, 
  ThumbsUp, 
  Star, 
  Bookmark, 
  Trash2,
  Edit2,
  User,
  Eye
} from 'lucide-react';

export default function ResourceCard({ 
  resource, 
  currentUser,
  onSelect, 
  onUpvote, 
  onDownload, 
  onDelete,
  onEdit,
  isBookmarked, 
  onToggleBookmark 
}) {
  const currentUserId = currentUser ? (currentUser.id || currentUser._id) : null;
  const uploaderId = resource.uploader ? (resource.uploader._id || resource.uploader.id || resource.uploader) : null;
  const isOwner = currentUserId && uploaderId && (String(currentUserId) === String(uploaderId));

  const getCategoryStyles = (cat) => {
    switch (cat) {
      case 'Notes':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'PYQ':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Lab':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Book':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'Link':
        return 'bg-sky-50 text-sky-700 border-sky-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const formatSize = (bytes) => {
    if (!bytes || bytes === 0) return 'External Link';
    const mb = bytes / (1024 * 1024);
    if (mb >= 1) return `${mb.toFixed(1)} MB`;
    return `${Math.round(bytes / 1024)} KB`;
  };

  return (
    <div className={`bg-white rounded-xl border transition-all flex flex-col justify-between ${
      isOwner 
        ? 'border-indigo-300 ring-1 ring-indigo-100' 
        : 'border-slate-200 hover:border-slate-300 hover:shadow-xs'
    }`}>
      
      {/* Card Content Area */}
      <div className="p-4 sm:p-4.5 flex-1">
        
        {/* Header Tags & Action Icons */}
        <div className="flex items-start justify-between gap-2 mb-2.5">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${getCategoryStyles(resource.category)}`}>
              {resource.category}
            </span>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
              {resource.department} • Sem {resource.semester}
            </span>
            {isOwner && (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-600 text-white">
                My Upload
              </span>
            )}
          </div>

          <div className="flex items-center gap-1">
            {/* Bookmark Icon */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleBookmark(resource);
              }}
              title={isBookmarked ? 'Remove from Saved' : 'Save to Library'}
              className={`p-1 rounded transition-colors ${
                isBookmarked
                  ? 'text-indigo-600 bg-indigo-50'
                  : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Bookmark className={`w-3.5 h-3.5 ${isBookmarked ? 'fill-indigo-600' : ''}`} />
            </button>

            {/* Strict Delete Icon: ONLY FOR OWNER */}
            {isOwner && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(resource);
                }}
                title="Delete your uploaded resource"
                className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Title */}
        <h3 
          onClick={() => onSelect(resource)}
          className="text-sm font-bold text-slate-900 hover:text-indigo-600 cursor-pointer line-clamp-2 leading-snug transition-colors"
          title={resource.title}
        >
          {resource.title}
        </h3>

        {/* Subject */}
        <div className="mt-1 text-xs font-semibold text-slate-600 truncate">
          {resource.subject}
        </div>

        {/* Description snippet */}
        <p className="mt-2 text-xs text-slate-500 line-clamp-2 leading-relaxed">
          {resource.description || 'No detailed description provided.'}
        </p>

        {/* Attribution & File Metadata */}
        <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
          <span className="flex items-center gap-1 truncate max-w-[170px]">
            <User className="w-3 h-3 shrink-0" />
            <span className="truncate">{resource.uploaderName || 'Student'}</span>
          </span>
          <span>{formatSize(resource.fileSize)}</span>
        </div>

      </div>

      {/* Card Footer */}
      <div className="px-4 py-2.5 bg-slate-50/60 border-t border-slate-100 flex items-center justify-between gap-2 text-xs">
        
        {/* Ratings & Downloads */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 text-amber-500 font-semibold">
            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
            <span>{resource.averageRating ? resource.averageRating.toFixed(1) : '5.0'}</span>
            <span className="text-[10px] text-slate-400 font-normal">
              ({resource.reviewCount || (resource.ratings ? resource.ratings.length : 0)})
            </span>
          </div>

          <div className="text-[11px] text-slate-400">
            {resource.downloadCount || 0} downloads
          </div>
        </div>

        {/* Actions: Preview & Download */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => onSelect(resource)}
            className="px-2 py-1 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 rounded transition-colors"
          >
            Preview
          </button>

          {resource.type === 'link' ? (
            <a
              href={resource.linkUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => onDownload(resource.id || resource._id)}
              className="flex items-center gap-1 px-2.5 py-1 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded text-xs font-semibold transition-colors"
            >
              <span>Visit</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          ) : (
            <button
              onClick={() => onDownload(resource.id || resource._id, resource.fileUrl, resource.originalFilename)}
              className="flex items-center gap-1 px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded text-xs font-semibold transition-colors"
            >
              <Download className="w-3 h-3" />
              <span>Get</span>
            </button>
          )}
        </div>

      </div>

    </div>
  );
}
