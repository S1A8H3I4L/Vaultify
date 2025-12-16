import React from 'react';
import { FileNode, FileType } from '../types';
import { IconHelper } from './IconHelper';
import { MoreVertical, Star, Folder, CheckSquare, Square } from 'lucide-react';

interface FileGridProps {
  files: FileNode[];
  onFolderClick: (folderId: string) => void;
  viewMode: 'grid' | 'list';
  onToggleStar: (fileId: string) => void;
  onContextMenu: (e: React.MouseEvent, file: FileNode) => void;
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onSelectAll: (ids: string[]) => void;
}

export const FileGrid: React.FC<FileGridProps> = ({ 
  files, 
  onFolderClick, 
  viewMode, 
  onToggleStar, 
  onContextMenu,
  selectedIds,
  onToggleSelect,
  onSelectAll
}) => {
  const folders = files.filter(f => f.type === FileType.FOLDER);
  const regularFiles = files.filter(f => f.type !== FileType.FOLDER);

  // Helper formats
  const formatSize = (bytes?: number) => {
    if (!bytes) return '--';
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    if (bytes === 0) return '0 Byte';
    const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)).toString());
    return Math.round(bytes / Math.pow(1024, i)) + ' ' + sizes[i];
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const handleSelectAllClick = () => {
    if (selectedIds.size === files.length && files.length > 0) {
        onSelectAll([]);
    } else {
        onSelectAll(files.map(f => f.id));
    }
  };

  if (viewMode === 'list') {
    return (
      <div className="w-full bg-white rounded-lg border border-slate-200 overflow-hidden mb-20">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200">
              <th className="p-4 w-10">
                 <button onClick={handleSelectAllClick} className="flex items-center text-slate-400 hover:text-slate-600">
                    {files.length > 0 && selectedIds.size === files.length ? <CheckSquare size={18} className="text-blue-600" /> : <Square size={18} />}
                 </button>
              </th>
              <th className="p-4 text-xs font-medium text-slate-500 uppercase">Name</th>
              <th className="p-4 text-xs font-medium text-slate-500 uppercase w-32">Owner</th>
              <th className="p-4 text-xs font-medium text-slate-500 uppercase w-32">Last Modified</th>
              <th className="p-4 text-xs font-medium text-slate-500 uppercase w-24">Size</th>
              <th className="p-4 w-10"></th>
            </tr>
          </thead>
          <tbody>
            {files.map(file => {
              const isSelected = selectedIds.has(file.id);
              return (
              <tr 
                key={file.id} 
                className={`group border-b border-slate-100 last:border-0 cursor-pointer transition-colors ${isSelected ? 'bg-blue-50' : 'hover:bg-slate-50'}`}
                onClick={() => onToggleSelect(file.id)}
                onDoubleClick={() => file.type === FileType.FOLDER && onFolderClick(file.id)}
                onContextMenu={(e) => onContextMenu(e, file)}
              >
                <td className="p-4" onClick={(e) => { e.stopPropagation(); onToggleSelect(file.id); }}>
                    {isSelected ? <CheckSquare size={18} className="text-blue-600" /> : <Square size={18} className="text-slate-300 group-hover:text-slate-400" />}
                </td>
                <td className="p-3">
                  <div className="flex items-center gap-3">
                    <IconHelper type={file.type} className="w-5 h-5" />
                    <span className={`text-sm font-medium ${isSelected ? 'text-blue-700' : 'text-slate-700'}`}>{file.name}</span>
                    {file.starred && <Star size={12} className="text-yellow-400 fill-yellow-400" />}
                  </div>
                </td>
                <td className="p-3 text-sm text-slate-600">{file.ownerName}</td>
                <td className="p-3 text-sm text-slate-500">{formatDate(file.modifiedAt)}</td>
                <td className="p-3 text-sm text-slate-500">{formatSize(file.size)}</td>
                <td className="p-3 text-right opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={(e) => { e.stopPropagation(); onContextMenu(e, file); }} className="p-1 hover:bg-slate-200 rounded-full">
                    <MoreVertical size={16} className="text-slate-500" />
                  </button>
                </td>
              </tr>
            )})}
            {files.length === 0 && (
              <tr>
                <td colSpan={6} className="p-8 text-center text-slate-400">
                  No files found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    );
  }

  // Grid View
  return (
    <div className="space-y-6 mb-20">
      {folders.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-xs font-medium text-slate-500 uppercase tracking-wider">Folders</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {folders.map(folder => {
               const isSelected = selectedIds.has(folder.id);
               return (
              <div 
                key={folder.id}
                onClick={() => onToggleSelect(folder.id)}
                onDoubleClick={() => onFolderClick(folder.id)}
                onContextMenu={(e) => onContextMenu(e, folder)}
                className={`group flex flex-col justify-between p-3 border rounded-xl cursor-pointer transition-all h-32 relative ${isSelected ? 'bg-blue-50 border-blue-400 shadow-sm' : 'bg-white border-slate-200 hover:shadow-md hover:border-blue-200'}`}
              >
                {/* Selection Checkbox (visible on hover or selected) */}
                <div 
                    className={`absolute top-2 left-2 z-10 transition-opacity ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
                    onClick={(e) => { e.stopPropagation(); onToggleSelect(folder.id); }}
                >
                    {isSelected ? <CheckSquare size={20} className="text-blue-600 bg-white rounded-sm" /> : <Square size={20} className="text-slate-400 hover:text-slate-600" />}
                </div>

                <div className="flex justify-between items-start pl-6"> 
                  <div className="p-2 bg-blue-50 rounded-lg">
                    <Folder className="w-6 h-6 text-blue-500" />
                  </div>
                   <button 
                    onClick={(e) => { e.stopPropagation(); onToggleStar(folder.id); }}
                    className={`p-1 rounded-full hover:bg-slate-100 ${folder.starred ? 'text-yellow-400 fill-yellow-400' : 'text-slate-300'}`}
                  >
                    <Star size={16} className={folder.starred ? 'fill-yellow-400' : ''} />
                  </button>
                </div>
                <div>
                  <p className={`text-sm font-medium truncate ${isSelected ? 'text-blue-700' : 'text-slate-700'}`}>{folder.name}</p>
                  <p className="text-xs text-slate-400 mt-1">{formatDate(folder.modifiedAt)}</p>
                </div>
              </div>
            )})}
          </div>
        </div>
      )}

      {regularFiles.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-xs font-medium text-slate-500 uppercase tracking-wider">Files</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {regularFiles.map(file => {
              const isSelected = selectedIds.has(file.id);
              return (
              <div 
                key={file.id}
                onClick={() => onToggleSelect(file.id)}
                onContextMenu={(e) => onContextMenu(e, file)}
                className={`group relative border rounded-xl cursor-pointer transition-all overflow-hidden ${isSelected ? 'bg-blue-50 border-blue-400 ring-1 ring-blue-400' : 'bg-white border-slate-200 hover:shadow-md hover:border-blue-200'}`}
              >
                 {/* Selection Checkbox (visible on hover or selected) */}
                <div 
                    className={`absolute top-2 left-2 z-10 transition-opacity ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
                    onClick={(e) => { e.stopPropagation(); onToggleSelect(file.id); }}
                >
                     {isSelected ? <CheckSquare size={20} className="text-blue-600 bg-white rounded-sm" /> : <Square size={20} className="text-slate-400 hover:text-slate-600 shadow-sm" />}
                </div>

                <div className="h-32 bg-slate-100 flex items-center justify-center relative overflow-hidden">
                   {file.thumbnailUrl ? (
                     <img src={file.thumbnailUrl} alt={file.name} className="w-full h-full object-cover opacity-90 group-hover:scale-105 transition-transform" />
                   ) : (
                     <IconHelper type={file.type} className="w-12 h-12 opacity-50" />
                   )}
                   <div className={`absolute inset-0 transition-colors ${isSelected ? 'bg-blue-500/10' : 'bg-black/0 group-hover:bg-black/5'}`} />
                </div>
                <div className="p-3 border-t border-slate-100">
                  <div className="flex justify-between items-center gap-2">
                    <div className="flex items-center gap-2 truncate">
                      <IconHelper type={file.type} className="w-4 h-4 flex-shrink-0" />
                      <p className={`text-sm font-medium truncate ${isSelected ? 'text-blue-700' : 'text-slate-700'}`}>{file.name}</p>
                    </div>
                    <button 
                      onClick={(e) => { e.stopPropagation(); onContextMenu(e, file); }}
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <MoreVertical size={16} className="text-slate-500 hover:text-slate-700" />
                    </button>
                  </div>
                </div>
              </div>
            )})}
          </div>
        </div>
      )}
       {files.length === 0 && (
          <div className="flex flex-col items-center justify-center h-64 text-slate-400">
            <IconHelper type={FileType.UNKNOWN} className="w-16 h-16 mb-4 text-slate-200" />
            <p>This folder is empty</p>
          </div>
        )}
    </div>
  );
};
