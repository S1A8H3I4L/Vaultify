import React, { useEffect, useState } from 'react';
import { X, Download, FileText, ExternalLink, AlertTriangle } from 'lucide-react';
import { FileNode, FileType } from '../types';
import { IconHelper } from './IconHelper';

interface FilePreviewModalProps {
  file: FileNode | null;
  fileBlob?: Blob; // Changed from File to Blob for broader compatibility with IndexedDB
  onClose: () => void;
}

export const FilePreviewModal: React.FC<FilePreviewModalProps> = ({ file, fileBlob, onClose }) => {
  const [objectUrl, setObjectUrl] = useState<string | null>(null);

  // Generate a URL for the blob when the component mounts or file changes
  useEffect(() => {
    if (fileBlob) {
      const url = URL.createObjectURL(fileBlob);
      setObjectUrl(url);
      
      // Cleanup URL on unmount or change
      return () => {
        URL.revokeObjectURL(url);
      };
    } else if (file?.thumbnailUrl) {
      // Fallback for pre-existing images if valid URL
      setObjectUrl(file.thumbnailUrl);
    } else {
      setObjectUrl(null);
    }
  }, [fileBlob, file]);

  if (!file) return null;

  const handleDownload = () => {
    const link = document.createElement('a');
    if (objectUrl) {
        link.href = objectUrl;
        link.download = file.name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    } else {
        alert("Cannot download: This is a demo file without backing data. Please upload a new file to test download.");
    }
  };

  const renderContent = () => {
    // Case 1: We have the actual file data (Uploaded in this session)
    if (fileBlob && objectUrl) {
        switch (file.type) {
            case FileType.IMAGE:
                return (
                    <div className="flex items-center justify-center h-full bg-slate-900/50 rounded-lg overflow-hidden">
                        <img 
                            src={objectUrl} 
                            alt={file.name} 
                            className="max-w-full max-h-[70vh] object-contain shadow-2xl" 
                        />
                    </div>
                );
            case FileType.VIDEO:
                return (
                    <div className="flex items-center justify-center h-full bg-black rounded-lg overflow-hidden">
                        <video controls className="max-w-full max-h-[70vh]">
                            <source src={objectUrl} type={fileBlob.type} />
                            Your browser does not support the video tag.
                        </video>
                    </div>
                );
            case FileType.PDF:
                return (
                    <div className="h-full w-full bg-slate-100 rounded-lg overflow-hidden">
                        <iframe 
                            src={objectUrl} 
                            className="w-full h-full border-none" 
                            title="PDF Preview"
                        />
                    </div>
                );
            default:
                // Other types that browsers can't easily preview natively
                 return (
                    <div className="flex flex-col items-center justify-center h-full bg-slate-50 rounded-lg p-10 text-center">
                        <IconHelper type={file.type} className="w-24 h-24 mb-6" />
                        <h3 className="text-xl font-semibold text-slate-800 mb-2">Preview not available</h3>
                        <p className="text-slate-500 mb-6">
                            This file type ({fileBlob.type}) cannot be previewed in the browser.
                        </p>
                        <button onClick={handleDownload} className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                            <Download size={18} />
                            Download File
                        </button>
                    </div>
                );
        }
    }

    // Case 2: No File Data (Mock Data or Page Refreshed)
    // We can only preview basic images if they have a valid external URL
    if (file.type === FileType.IMAGE && file.thumbnailUrl && file.thumbnailUrl.startsWith('http')) {
        return (
            <div className="flex items-center justify-center h-full bg-slate-900/50 rounded-lg overflow-hidden">
              <img 
                src={file.thumbnailUrl} 
                alt={file.name} 
                className="max-w-full max-h-[70vh] object-contain shadow-2xl" 
              />
            </div>
          );
    }

    // Default Fallback
    return (
        <div className="flex flex-col items-center justify-center h-full bg-slate-50 rounded-lg p-10 text-center border border-slate-200">
           <div className="bg-amber-50 p-4 rounded-full mb-4">
              <AlertTriangle className="w-12 h-12 text-amber-500" />
           </div>
           <h3 className="text-xl font-semibold text-slate-800 mb-2">File Content Not Found</h3>
           <p className="text-slate-500 max-w-md mb-6">
             Because this is a demo app without a backend server, the actual content of this file was lost when the page refreshed (or it is mock data). 
             <br/><br/>
             <span className="font-medium text-slate-700">Try uploading a new file to test the preview and download features.</span>
           </p>
           <button onClick={handleDownload} disabled={!objectUrl} className="flex items-center gap-2 bg-slate-200 text-slate-400 cursor-not-allowed px-6 py-2 rounded-lg">
             <Download size={18} />
             Download Unavailable
          </button>
        </div>
      );
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-5xl h-[85vh] rounded-xl flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-white">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-slate-100 rounded-lg">
                <IconHelper type={file.type} className="w-5 h-5" />
            </div>
            <div>
                <h3 className="font-semibold text-slate-800 truncate max-w-md">{file.name}</h3>
                <p className="text-xs text-slate-500">
                    {(file.size ? (file.size / 1024 / 1024).toFixed(2) : 0)} MB • {file.modifiedAt.toLocaleDateString()}
                </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button 
                onClick={handleDownload}
                className={`p-2 rounded-full transition-colors ${objectUrl ? 'text-slate-500 hover:bg-slate-100' : 'text-slate-300 cursor-not-allowed'}`}
                title={objectUrl ? "Download" : "Download Unavailable"}
                disabled={!objectUrl}
            >
                <Download size={20} />
            </button>
            <button 
                onClick={onClose}
                className="p-2 text-slate-500 hover:bg-red-50 hover:text-red-500 rounded-full transition-colors"
                title="Close"
            >
                <X size={20} />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-auto p-6 bg-slate-50">
            {renderContent()}
        </div>
      </div>
    </div>
  );
};