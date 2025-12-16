import React, { useState, useEffect, useRef } from 'react';
import { X, UserPlus, Users, Link as LinkIcon, Copy } from 'lucide-react';
import { FileNode } from '../types';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedFiles: FileNode[];
  onShare: (email: string) => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({ isOpen, onClose, selectedFiles, onShare }) => {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('Editor');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
      setEmail('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      onShare(email);
      onClose();
    }
  };

  const fileCount = selectedFiles.length;
  const title = fileCount === 1 ? `Share "${selectedFiles[0].name}"` : `Share ${fileCount} files`;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
            <h2 className="text-lg font-medium text-slate-800 truncate pr-4">{title}</h2>
            <button onClick={onClose} className="p-1 text-slate-400 hover:bg-slate-100 rounded-full transition-colors">
                <X size={20} />
            </button>
        </div>

        <div className="p-6">
            <form onSubmit={handleSubmit}>
                <div className="space-y-4">
                    <div className="relative">
                        <input
                            ref={inputRef}
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Add people, groups, and calendar events"
                            className="w-full pl-4 pr-32 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
                        />
                        <div className="absolute right-2 top-1/2 -translate-y-1/2">
                            <select 
                                value={role}
                                onChange={(e) => setRole(e.target.value)}
                                className="bg-transparent text-sm font-medium text-slate-600 focus:outline-none cursor-pointer"
                            >
                                <option>Editor</option>
                                <option>Viewer</option>
                                <option>Commenter</option>
                            </select>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100">
                         <div className="p-2 bg-slate-200 rounded-full">
                            <Users size={18} className="text-slate-500" />
                         </div>
                         <div className="flex-1">
                             <p className="text-sm font-medium text-slate-700">People with access</p>
                             <p className="text-xs text-slate-500">You (Owner)</p>
                         </div>
                    </div>
                    
                    <div className="pt-2">
                        <h4 className="text-xs font-semibold text-slate-500 uppercase mb-2">General access</h4>
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-slate-100 rounded-full">
                                <LinkIcon size={18} className="text-slate-500" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-slate-700">Restricted</p>
                                <p className="text-xs text-slate-500">Only people with access can open with the link</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex items-center justify-between mt-8">
                    <button type="button" className="flex items-center gap-2 text-blue-600 px-3 py-1.5 rounded-full hover:bg-blue-50 transition-colors text-sm font-medium border border-transparent hover:border-blue-100">
                        <Copy size={16} />
                        Copy link
                    </button>
                    <button 
                        type="submit" 
                        disabled={!email.trim()}
                        className="bg-blue-600 text-white px-6 py-2 rounded-full font-medium text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
                    >
                        Send
                    </button>
                </div>
            </form>
        </div>
      </div>
    </div>
  );
};
