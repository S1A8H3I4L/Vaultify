import React, { useEffect, useRef, useState, useLayoutEffect } from 'react';
import { Trash2, Edit2, Star, Share2, Eye, Download, FileX, RefreshCw } from 'lucide-react';
import { FileNode } from '../types';

interface FileContextMenuProps {
  x: number;
  y: number;
  file: FileNode;
  onClose: () => void;
  onAction: (action: string, fileId: string) => void;
}

export const FileContextMenu: React.FC<FileContextMenuProps> = ({ x, y, file, onClose, onAction }) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ top: y, left: x });

  // Handle Close on Click Outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('scroll', onClose); // Close on scroll
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('scroll', onClose);
    };
  }, [onClose]);

  // Smart Positioning: Run before paint
  useLayoutEffect(() => {
    if (menuRef.current) {
      const rect = menuRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      let newTop = y;
      let newLeft = x;

      // Flip Upwards if not enough space at bottom
      if (y + rect.height > viewportHeight) {
        newTop = y - rect.height;
      }

      // Flip Leftwards if not enough space at right
      if (x + rect.width > viewportWidth) {
        newLeft = x - rect.width;
      }

      // Ensure it doesn't go off-screen top/left
      if (newTop < 0) newTop = 10;
      if (newLeft < 0) newLeft = 10;

      setPosition({ top: newTop, left: newLeft });
    }
  }, [x, y]);

  return (
    <div 
      ref={menuRef}
      className="fixed z-50 bg-white rounded-lg shadow-xl border border-slate-200 py-2 w-56 animate-in fade-in zoom-in-95 duration-100"
      style={{ top: position.top, left: position.left }}
      onClick={(e) => e.stopPropagation()} 
    >
      <div className="px-4 py-2 border-b border-slate-100 mb-1 flex items-center gap-2">
         {/* Small Icon for context */}
        <p className="text-sm font-medium text-slate-700 truncate select-none">{file.name}</p>
      </div>

      {!file.isTrashed ? (
        <>
            <button 
                onClick={() => onAction('preview', file.id)}
                className="w-full text-left px-4 py-2 hover:bg-slate-100 flex items-center gap-3 text-slate-700 text-sm"
            >
                <Eye size={16} className="text-slate-500" />
                Preview
            </button>
            <button 
                onClick={() => onAction('share', file.id)}
                className="w-full text-left px-4 py-2 hover:bg-slate-100 flex items-center gap-3 text-slate-700 text-sm"
            >
                <Share2 size={16} className="text-slate-500" />
                Share
            </button>
            <button 
                onClick={() => onAction('star', file.id)}
                className="w-full text-left px-4 py-2 hover:bg-slate-100 flex items-center gap-3 text-slate-700 text-sm"
            >
                <Star size={16} className={file.starred ? "text-yellow-500 fill-yellow-500" : "text-slate-500"} />
                {file.starred ? 'Remove from starred' : 'Add to starred'}
            </button>
            <button 
                onClick={() => onAction('rename', file.id)}
                className="w-full text-left px-4 py-2 hover:bg-slate-100 flex items-center gap-3 text-slate-700 text-sm"
            >
                <Edit2 size={16} className="text-slate-500" />
                Rename
            </button>
            <div className="my-1 border-b border-slate-100"></div>
            <button 
                onClick={() => onAction('delete', file.id)}
                className="w-full text-left px-4 py-2 hover:bg-slate-100 flex items-center gap-3 text-red-600 text-sm"
            >
                <Trash2 size={16} className="text-red-500" />
                Move to trash
            </button>
        </>
      ) : (
        <>
            <button 
                onClick={() => onAction('restore', file.id)}
                className="w-full text-left px-4 py-2 hover:bg-slate-100 flex items-center gap-3 text-slate-700 text-sm"
            >
                <RefreshCw size={16} className="text-green-600" />
                Restore
            </button>
            <button 
                onClick={() => onAction('delete-forever', file.id)}
                className="w-full text-left px-4 py-2 hover:bg-slate-100 flex items-center gap-3 text-red-600 text-sm"
            >
                <FileX size={16} className="text-red-500" />
                Delete forever
            </button>
        </>
      )}
    </div>
  );
};
