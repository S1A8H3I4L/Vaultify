import React, { useState, useRef, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { FileGrid } from './components/FileGrid';
import { AIChat } from './components/AIChat';
import { StorageStatsModal } from './components/StorageStats';
import { AuthPage } from './components/AuthPage';
import { CreateFolderModal } from './components/CreateFolderModal';
import { FileContextMenu } from './components/FileContextMenu';
import { FilePreviewModal } from './components/FilePreviewModal';
import { ShareModal } from './components/ShareModal';
import { ToastContainer, ToastMessage } from './components/Toast';
import { TOTAL_STORAGE } from './constants';
import { FileNode, FileType, User } from './types';
import { db } from './services/db';
import { blobStorage } from './services/blobStorage';
import { Search, LayoutGrid, List as ListIcon, Menu, ChevronRight, Settings, Sparkles, LogOut, HelpCircle, UploadCloud, Trash2, Share2, X, CheckSquare } from 'lucide-react';

const App = () => {
  // Auth State
  const [user, setUser] = useState<User | null>(null);

  // App State
  const [currentView, setCurrentView] = useState('drive'); 
  const [files, setFiles] = useState<FileNode[]>([]); // Initialized empty, loaded from DB
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isAIChatOpen, setIsAIChatOpen] = useState(false);
  const [isStatsOpen, setIsStatsOpen] = useState(false);
  const [isNewFolderOpen, setIsNewFolderOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Interaction State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number, file: FileNode } | null>(null);
  
  const [previewFile, setPreviewFile] = useState<FileNode | null>(null);
  const [previewBlob, setPreviewBlob] = useState<Blob | null>(null);

  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [storageUsed, setStorageUsed] = useState(0);
  
  // Selection State
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set<string>());

  // --- EFFECT: Load Data on User Change ---
  useEffect(() => {
    if (user) {
      refreshFiles();
    }
  }, [user]);

  const refreshFiles = () => {
    if (user) {
      setFiles(db.getFiles(user.id));
      setStorageUsed(db.getStorageUsage(user.id));
    }
  };

  // --- HELPERS ---

  const addToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, message, type }]);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const handleLogin = (u: User) => {
    // Attempt to register or login in DB
    try {
        if (!db.authenticate(u.email)) {
             db.createUser(u);
        }
        setUser(u);
        addToast(`Welcome back, ${u.name}`);
    } catch (e) {
        setUser(u);
    }
  };

  const handleLogout = () => {
    setUser(null);
    setCurrentFolderId(null);
    setCurrentView('drive');
    setContextMenu(null);
    setSearchQuery('');
    setSelectedIds(new Set<string>());
    setPreviewBlob(null);
    setPreviewFile(null);
  };

  // Breadcrumbs logic
  const getBreadcrumbs = () => {
    if (currentView === 'trash') return [{ id: null, name: 'Trash' }];
    if (currentView === 'shared') return [{ id: null, name: 'Shared with me' }];
    if (currentView === 'starred') return [{ id: null, name: 'Starred' }];
    if (currentView === 'recent') return [{ id: null, name: 'Recent' }];

    const crumbs = [{ id: null, name: 'My Drive' }];
    let currentId = currentFolderId;
    const path = [];
    
    // Safety check to prevent infinite loops if data is corrupted
    let depth = 0;
    while (currentId && depth < 20) {
      const folder = files.find(f => f.id === currentId);
      if (folder) {
        path.unshift({ id: folder.id, name: folder.name });
        currentId = folder.parentId;
      } else {
        break;
      }
      depth++;
    }
    return [...crumbs, ...path];
  };

  // Filter Logic
  const filteredFiles = files.filter(file => {
    // 1. Search (Global filter)
    if (searchQuery) {
      if (currentView === 'trash') {
        return file.name.toLowerCase().includes(searchQuery.toLowerCase()) && file.isTrashed;
      }
      return file.name.toLowerCase().includes(searchQuery.toLowerCase()) && !file.isTrashed;
    }

    // 2. View specific filters
    if (currentView === 'trash') return file.isTrashed;
    if (file.isTrashed) return false; // Hide trashed files from all other views

    if (currentView === 'shared') return file.sharedWith.includes(user?.email || '');
    if (currentView === 'starred') return file.starred;
    if (currentView === 'recent') return true; 

    // 3. Drive Folder Navigation
    return file.parentId === currentFolderId;
  });

  // --- SELECTION ACTIONS ---
  
  const handleToggleSelect = (id: string) => {
      const newSelection = new Set(selectedIds);
      if (newSelection.has(id)) {
          newSelection.delete(id);
      } else {
          newSelection.add(id);
      }
      setSelectedIds(newSelection);
  };

  const handleSelectAll = (ids: string[]) => {
      setSelectedIds(new Set(ids));
  };

  const handleBulkDelete = async () => {
      if (!user) return;
      try {
          let count = 0;
          const idsToDelete = Array.from(selectedIds);
          
          for (const id of idsToDelete) {
              if (currentView === 'trash') {
                  // Permanent delete
                  db.deleteFile(id, user.id);
                  // Clean up persistent blob
                  await blobStorage.deleteFile(id);
              } else {
                  // Move to trash
                  db.updateFile(id, { isTrashed: true }, user.id);
              }
              count++;
          }
          refreshFiles();
          setSelectedIds(new Set<string>());
          addToast(currentView === 'trash' ? `Permanently deleted ${count} items` : `Moved ${count} items to trash`);
      } catch (e: any) {
          addToast("Some items could not be deleted (permission error)", "error");
      }
  };

  const handleShareSubmit = (email: string) => {
      if (!user) return;
      const ids = Array.from(selectedIds);
      if (ids.length === 0) return;
      
      try {
          db.shareFiles(ids, email, user.id);
          refreshFiles();
          setSelectedIds(new Set<string>());
          addToast(`Shared ${ids.length} item${ids.length > 1 ? 's' : ''} with ${email}`);
      } catch(e) {
          addToast("Failed to share (are you the owner?)", "error");
      }
  };

  // --- ACTIONS ---

  const handleCreateFolder = (name: string) => {
    if (!user) return;
    try {
      const newFolder: FileNode = {
        id: Date.now().toString(),
        name,
        type: FileType.FOLDER,
        modifiedAt: new Date(),
        starred: false,
        isTrashed: false,
        parentId: currentFolderId,
        ownerId: user.id,
        ownerName: user.name,
        sharedWith: []
      };
      db.createFile(newFolder, user.id);
      refreshFiles();
      addToast(`Folder "${name}" created`);
    } catch (e: any) {
      addToast(e.message, 'error');
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFolderUploadClick = () => {
    folderInputRef.current?.click();
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(Array.from(e.target.files) as File[]);
    }
    if (e.target) e.target.value = ''; // Reset
  };

  const handleFiles = async (fileList: File[]) => {
     if (!user) return;
     let successCount = 0;
     let failCount = 0;

     for (const file of fileList) {
        try {
            let parentId = currentFolderId;
            // Handle Directory Structure if present
            const relativePath = (file as any).webkitRelativePath;
            if (relativePath) {
                const parts = relativePath.split('/');
                const folders = parts.slice(0, parts.length - 1);
                for (const folderName of folders) {
                    const existing = db.findFolder(folderName, parentId, user.id);
                    if (existing) {
                        parentId = existing.id;
                    } else {
                         const newFolder: FileNode = {
                            id: Date.now().toString() + Math.random(),
                            name: folderName,
                            type: FileType.FOLDER,
                            modifiedAt: new Date(),
                            starred: false,
                            isTrashed: false,
                            parentId: parentId,
                            ownerId: user.id,
                            ownerName: user.name,
                            sharedWith: []
                          };
                          db.createFile(newFolder, user.id);
                          parentId = newFolder.id;
                    }
                }
            }

            // Determine type
            let type = FileType.UNKNOWN;
            if (file.type.includes('image')) type = FileType.IMAGE;
            else if (file.type.includes('pdf')) type = FileType.PDF;
            else if (file.type.includes('video')) type = FileType.VIDEO;
            else if (file.type.includes('audio')) type = FileType.AUDIO;
            else if (file.name.endsWith('.doc') || file.name.endsWith('.docx')) type = FileType.DOC;

            // Generate ID
            const newId = Date.now().toString() + Math.random();

            // Store Blob in Persistent Storage (IndexedDB)
            await blobStorage.saveFile(newId, file);

            const newFile: FileNode = {
                id: newId,
                name: file.name,
                type: type,
                size: file.size,
                modifiedAt: new Date(),
                starred: false,
                isTrashed: false,
                parentId: parentId,
                ownerId: user.id,
                ownerName: user.name,
                sharedWith: [],
                thumbnailUrl: type === FileType.IMAGE ? URL.createObjectURL(file) : undefined
            };

            db.createFile(newFile, user.id);
            successCount++;
        } catch(e) {
            failCount++;
        }
     }

     refreshFiles();
     if (successCount > 0) addToast(`Uploaded ${successCount} item${successCount > 1 ? 's' : ''}`);
     if (failCount > 0) addToast(`Failed to upload ${failCount} item${failCount > 1 ? 's' : ''}`, 'error');
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(Array.from(e.dataTransfer.files) as File[]);
    }
  };

  const handleToggleStar = (id: string) => {
    if (!user) return;
    const file = files.find(f => f.id === id);
    if (file) {
       db.updateFile(id, { starred: !file.starred }, user.id);
       refreshFiles();
       addToast(!file.starred ? "Added to Starred" : "Removed from Starred", "info");
    }
  };

  const handleContextMenu = (e: React.MouseEvent, file: FileNode) => {
    e.preventDefault();
    // If context menu on an item not in selection, clear selection and select this one
    if (!selectedIds.has(file.id)) {
        setSelectedIds(new Set([file.id]));
    }
    setContextMenu({ x: e.clientX, y: e.clientY, file });
  };

  const handleMenuAction = async (action: string, fileId: string) => {
    setContextMenu(null);
    if (!user) return;

    try {
        if (action === 'delete') {
          db.updateFile(fileId, { isTrashed: true }, user.id);
          addToast("File moved to trash");
        } else if (action === 'delete-forever') {
          if (confirm('Delete this file forever?')) {
            db.deleteFile(fileId, user.id);
             // Clean up blob
             await blobStorage.deleteFile(fileId);
            addToast("File permanently deleted");
          }
        } else if (action === 'restore') {
          db.updateFile(fileId, { isTrashed: false }, user.id);
          addToast("File restored from trash");
        } else if (action === 'rename') {
          const file = files.find(f => f.id === fileId);
          const newName = prompt('Rename file:', file?.name);
          if (newName && newName.trim()) {
            db.updateFile(fileId, { name: newName }, user.id);
            addToast("File renamed");
          }
        } else if (action === 'share') {
           setIsShareModalOpen(true);
        } else if (action === 'star') {
          handleToggleStar(fileId);
        } else if (action === 'preview') {
          const file = files.find(f => f.id === fileId);
          if (file) {
             // Try to fetch the blob from persistent storage
             try {
                const blob = await blobStorage.getFile(fileId);
                setPreviewBlob(blob);
             } catch(e) {
                setPreviewBlob(null);
             }
             setPreviewFile(file);
          }
        }
        refreshFiles();
    } catch (e: any) {
        addToast(e.message, 'error');
    }
  };

  // Auth Guard
  if (!user) {
    return <AuthPage onLogin={handleLogin} />;
  }

  // Derived state for selection
  const isSelectionActive = selectedIds.size > 0;
  const selectedFiles = files.filter(f => selectedIds.has(f.id));

  return (
    <div className="flex h-screen bg-white font-sans text-slate-900" 
         onContextMenu={(e) => e.preventDefault()}
         onClick={() => {
             // Clear selection on background click if not Ctrl key
             // This is handled partly in FileGrid to stop propagation
             // But clicking purely white space usually clears selection in file managers
         }}
    >
      <ToastContainer toasts={toasts} onDismiss={removeToast} />
      
      {/* Hidden File Inputs */}
      <input 
        type="file" 
        multiple
        ref={fileInputRef} 
        onChange={handleFileInputChange} 
        className="hidden" 
      />
      <input 
        type="file" 
        multiple
        {...({ webkitdirectory: "", directory: "" } as any)}
        ref={folderInputRef} 
        onChange={handleFileInputChange} 
        className="hidden" 
      />

      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Main Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-40 transform transition-transform duration-300 md:relative md:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
         <Sidebar 
           currentView={currentView}
           setCurrentView={(view) => { setCurrentView(view); setCurrentFolderId(null); setSearchQuery(''); setSelectedIds(new Set<string>()); }}
           storageUsed={storageUsed}
           totalStorage={TOTAL_STORAGE}
           onNewFolder={() => setIsNewFolderOpen(true)}
           onFileUpload={handleUploadClick}
           onFolderUpload={handleFolderUploadClick}
         />
      </div>

      {/* Main Content Area */}
      <div 
        className="flex-1 flex flex-col h-screen overflow-hidden relative"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {/* Drag Overlay */}
        {isDragOver && (
            <div className="absolute inset-0 bg-blue-50/90 z-50 flex items-center justify-center border-4 border-blue-400 border-dashed m-4 rounded-xl pointer-events-none animate-in fade-in duration-200">
                <div className="flex flex-col items-center text-blue-600">
                    <UploadCloud size={64} className="mb-4 animate-bounce" />
                    <span className="text-2xl font-bold">Drop files to upload</span>
                </div>
            </div>
        )}

        {/* Header */}
        <header className="h-16 px-4 md:px-6 flex items-center justify-between border-b border-slate-200 flex-shrink-0 bg-white z-10">
          <div className="flex items-center gap-4 flex-1">
             <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 md:hidden text-slate-600 hover:bg-slate-100 rounded-full">
               <Menu size={20} />
             </button>
             
             {/* Search Bar */}
             <div className="max-w-2xl w-full relative hidden sm:block">
               <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
               <input 
                 type="text"
                 placeholder="Search in Drive"
                 value={searchQuery}
                 onChange={(e) => setSearchQuery(e.target.value)}
                 className="w-full bg-slate-100 border-none rounded-full py-3 pl-10 pr-4 text-sm focus:bg-white focus:shadow-md focus:ring-0 transition-all outline-none text-slate-700 placeholder-slate-500"
               />
             </div>
          </div>

          <div className="flex items-center gap-2 md:gap-3 pl-4">
             <button onClick={() => setIsStatsOpen(true)} className="p-2 text-slate-500 hover:bg-slate-100 rounded-full" title="Storage Stats">
               <Settings size={22} />
             </button>
             {/* <button onClick={() => setIsAIChatOpen(!isAIChatOpen)} className={`p-2 rounded-full transition-colors ${isAIChatOpen ? 'bg-blue-100 text-blue-600' : 'text-slate-500 hover:bg-slate-100'}`} title="AI Assistant">
               <Sparkles size={20} />
             </button> */}
             
             {/* User Profile Dropdown Placeholder */}
             <div className="group relative ml-2 z-50">
                <button className="w-8 h-8 rounded-full overflow-hidden ring-2 ring-transparent hover:ring-slate-200 transition-all">
                  {user.avatarUrl ? (
                    <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-blue-600 flex items-center justify-center text-white text-xs">
                      {user.name.charAt(0)}
                    </div>
                  )}
                </button>
                {/* Logout Dropdown */}
                <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-100 py-2 hidden group-hover:block animate-in fade-in zoom-in-95 duration-100">
                  <div className="px-4 py-3 border-b border-slate-100 mb-1">
                    <p className="text-sm font-semibold text-slate-800">{user.name}</p>
                    <p className="text-xs text-slate-500 truncate">{user.email}</p>
                  </div>
                  <button onClick={handleLogout} className="w-full text-left px-4 py-2 hover:bg-slate-50 text-red-600 text-sm flex items-center gap-2">
                    <LogOut size={16} />
                    Sign out
                  </button>
                </div>
             </div>
          </div>
        </header>

        {/* Workspace Toolbar / Selection Toolbar */}
        <div className="px-6 py-3 flex items-center justify-between flex-shrink-0 min-h-[56px]">
           {isSelectionActive ? (
               // SELECTION TOOLBAR
               <div className="flex items-center justify-between w-full bg-blue-50/50 px-4 py-1.5 rounded-lg border border-blue-100 animate-in fade-in slide-in-from-top-2 duration-200">
                   <div className="flex items-center gap-3">
                       <button onClick={() => setSelectedIds(new Set<string>())} className="p-1 hover:bg-blue-100 rounded text-slate-500">
                           <X size={18} />
                       </button>
                       <span className="text-sm font-semibold text-slate-700">{selectedIds.size} selected</span>
                   </div>
                   <div className="flex items-center gap-2">
                        <button 
                             onClick={() => handleSelectAll(filteredFiles.map(f => f.id))}
                             className="text-sm text-slate-600 hover:text-blue-600 px-2 py-1 hover:bg-blue-100 rounded"
                             title="Select All"
                        >
                            Select All
                        </button>
                        <div className="w-px h-4 bg-blue-200 mx-1"></div>
                        <button 
                            onClick={() => setIsShareModalOpen(true)}
                            className="p-2 text-slate-600 hover:text-blue-600 hover:bg-blue-100 rounded-full"
                            title="Share"
                        >
                            <Share2 size={18} />
                        </button>
                        <button 
                            onClick={handleBulkDelete}
                            className="p-2 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-full"
                            title="Delete"
                        >
                            <Trash2 size={18} />
                        </button>
                   </div>
               </div>
           ) : (
               // DEFAULT TOOLBAR
               <>
                {/* Breadcrumbs */}
                <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
                    {getBreadcrumbs().map((crumb, index, arr) => (
                    <React.Fragment key={crumb.id || 'root'}>
                        <button 
                        onClick={() => crumb.id !== null ? setCurrentFolderId(crumb.id) : setCurrentView(currentView === 'drive' ? 'drive' : currentView)}
                        disabled={index === arr.length - 1}
                        className={`text-lg hover:bg-slate-100 px-3 py-1.5 rounded-full transition-colors whitespace-nowrap ${index === arr.length - 1 ? 'font-normal text-slate-800' : 'text-slate-500'}`}
                        >
                        {crumb.name}
                        </button>
                        {index < arr.length - 1 && <ChevronRight size={16} className="text-slate-400 flex-shrink-0" />}
                    </React.Fragment>
                    ))}
                </div>

                {/* View Toggle */}
                <div className="flex items-center gap-2">
                     <button 
                         onClick={() => handleSelectAll(filteredFiles.map(f => f.id))}
                         className="flex items-center gap-2 text-sm text-slate-500 hover:bg-slate-100 px-3 py-1.5 rounded-lg mr-2"
                         title="Select All Files in View"
                     >
                         <CheckSquare size={16} />
                         <span className="hidden lg:inline">Select all</span>
                     </button>
                    <button 
                    onClick={() => setViewMode('list')}
                    className={`p-2 rounded-full hover:bg-slate-100 ${viewMode === 'list' ? 'text-blue-600 bg-blue-50' : 'text-slate-500'}`}
                    title="List layout"
                    >
                    <ListIcon size={20} />
                    </button>
                    <button 
                    onClick={() => setViewMode('grid')}
                    className={`p-2 rounded-full hover:bg-slate-100 ${viewMode === 'grid' ? 'text-blue-600 bg-blue-50' : 'text-slate-500'}`}
                    title="Grid layout"
                    >
                    <LayoutGrid size={20} />
                    </button>
                    <div className="w-px h-6 bg-slate-300 mx-2"></div>
                    <button className="p-2 text-slate-500 hover:bg-slate-100 rounded-full">
                    <HelpCircle size={20} />
                    </button>
                </div>
               </>
           )}
        </div>

        {/* Content Scroll Area */}
        <main 
            className="flex-1 overflow-y-auto px-6 pb-6 bg-white scroll-smooth"
            onClick={(e) => {
                if(e.target === e.currentTarget) setSelectedIds(new Set<string>());
                setContextMenu(null);
            }}
        >
           {/* Mobile Search */}
           <div className="mb-4 sm:hidden">
              <input 
                 type="text"
                 placeholder="Search files..."
                 value={searchQuery}
                 onChange={(e) => setSearchQuery(e.target.value)}
                 className="w-full bg-slate-100 border border-slate-200 rounded-lg py-2 px-3 text-sm outline-none focus:border-blue-400"
               />
           </div>

           <FileGrid 
             files={filteredFiles} 
             onFolderClick={(id) => { setCurrentFolderId(id); setSearchQuery(''); setSelectedIds(new Set<string>()); }}
             viewMode={viewMode}
             onToggleStar={handleToggleStar}
             onContextMenu={handleContextMenu}
             selectedIds={selectedIds}
             onToggleSelect={handleToggleSelect}
             onSelectAll={handleSelectAll}
           />
        </main>
      </div>

      {/* Right Sidebar (AI Chat) */}
      <AIChat isOpen={isAIChatOpen} onClose={() => setIsAIChatOpen(false)} files={files} />

      {/* Stats Modal */}
      {isStatsOpen && (
        <StorageStatsModal files={files} onClose={() => setIsStatsOpen(false)} />
      )}

      {/* New Folder Modal */}
      <CreateFolderModal 
        isOpen={isNewFolderOpen}
        onClose={() => setIsNewFolderOpen(false)}
        onCreate={handleCreateFolder}
      />

      {/* Preview Modal */}
      <FilePreviewModal 
        file={previewFile}
        fileBlob={previewBlob || undefined}
        onClose={() => { setPreviewFile(null); setPreviewBlob(null); }}
      />

      {/* Share Modal */}
      <ShareModal 
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        selectedFiles={selectedFiles}
        onShare={handleShareSubmit}
      />

      {/* Context Menu */}
      {contextMenu && (
        <FileContextMenu 
            x={contextMenu.x}
            y={contextMenu.y}
            file={contextMenu.file}
            onClose={() => setContextMenu(null)}
            onAction={handleMenuAction}
        />
      )}
    </div>
  );
};

export default App;