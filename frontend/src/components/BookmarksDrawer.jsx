import React from 'react';
import { 
  X, 
  Bookmark, 
  Trash2, 
  Download, 
  ExternalLink, 
  FileText 
} from 'lucide-react';

export default function BookmarksDrawer({
  isOpen,
  onClose,
  bookmarks = [],
  onRemoveBookmark,
  onSelectResource,
  onDownload
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/40 backdrop-blur-xs flex justify-end text-xs">
      <div 
        className="w-full max-w-md bg-white h-full shadow-xl border-l border-slate-200 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Bookmark className="w-3.5 h-3.5 fill-indigo-600" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Saved Revision Library</h3>
              <p className="text-[11px] text-slate-400">{bookmarks.length} materials bookmarked in your account</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-700 rounded-md transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
          {bookmarks.length > 0 ? (
            bookmarks.map((res) => {
              const resId = res.id || res._id;
              return (
                <div 
                  key={resId} 
                  className="p-3 rounded-lg border border-slate-200 bg-white hover:border-slate-300 transition-colors space-y-1.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-100">
                        {res.category}
                      </span>
                      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                        {res.department} • Sem {res.semester}
                      </span>
                    </div>

                    <button
                      onClick={() => onRemoveBookmark(resId)}
                      className="text-slate-400 hover:text-rose-600 p-0.5 rounded"
                      title="Remove from saved library"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <h4 
                    onClick={() => {
                      onSelectResource(res);
                      onClose();
                    }}
                    className="font-bold text-slate-800 hover:text-indigo-600 cursor-pointer line-clamp-2 leading-snug"
                  >
                    {res.title}
                  </h4>

                  <div className="flex items-center justify-between pt-1 text-[11px] text-slate-400">
                    <span className="truncate max-w-[170px]">{res.subject}</span>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          onSelectResource(res);
                          onClose();
                        }}
                        className="px-2 py-0.5 text-slate-600 hover:text-slate-900 rounded font-semibold"
                      >
                        View
                      </button>

                      {res.type === 'link' ? (
                        <a
                          href={res.linkUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() => onDownload(resId)}
                          className="flex items-center gap-1 text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded font-bold"
                        >
                          <span>Visit</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      ) : (
                        <button
                          onClick={() => onDownload(resId, res.fileUrl, res.originalFilename)}
                          className="flex items-center gap-1 text-white bg-slate-900 hover:bg-slate-800 px-2 py-0.5 rounded font-bold"
                        >
                          <Download className="w-2.5 h-2.5" />
                          <span>Get</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400 space-y-1.5">
              <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400">
                <Bookmark className="w-5 h-5" />
              </div>
              <p className="font-semibold text-slate-700">No saved resources yet</p>
              <p className="text-[11px] text-slate-400 max-w-xs">
                Click the bookmark icon on any course material or PYQ card to save it here for fast exam-day revision.
              </p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
