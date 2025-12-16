import React, { useState, useRef, useEffect } from 'react';
import {
  Plus,
  HardDrive,
  Users,
  Clock,
  Star,
  Trash2,
  Cloud,
  Database,
  FolderPlus,
  FileUp,
  FolderUp,
  FileText,
  Table2,
  Presentation
} from 'lucide-react';

interface SidebarProps {
  currentView: string;
  setCurrentView: (view: string) => void;
  storageUsed: number;
  totalStorage: number;
  onNewFolder: () => void;
  onFileUpload: () => void;
  onFolderUpload: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  setCurrentView,
  storageUsed,
  totalStorage,
  onNewFolder,
  onFileUpload,
  onFolderUpload
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const menuItems = [
    { id: 'drive', label: 'My Drive', icon: HardDrive },
    { id: 'shared', label: 'Shared with me', icon: Users },
    { id: 'recent', label: 'Recent', icon: Clock },
    { id: 'starred', label: 'Starred', icon: Star },
    { id: 'trash', label: 'Trash', icon: Trash2 },
  ];

  const usedGB = (storageUsed / (1024 * 1024 * 1024)).toFixed(2);
  const totalGB = (totalStorage / (1024 * 1024 * 1024)).toFixed(0);
  const percentage = Math.min((storageUsed / totalStorage) * 100, 100);

  // Storage warning logic
  const isStorageCritical = percentage > 90;
  const progressBarColor = isStorageCritical ? 'bg-red-500' : 'bg-blue-600';

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="w-64 bg-white border-r border-slate-200 h-full flex flex-col p-4 flex-shrink-0 hidden md:flex">
      {/* Brand */}
      <div className="flex items-center gap-2 mb-8 px-2 pl-4">
        <div className="w-8 h-8 flex items-center justify-center">
          <img
            src="/Logo.png"
            alt="Vaultify Logo"
            className="w-8 h-8 object-contain"
          />
        </div>
        <span className="text-xl font-medium tracking-tight">
          <span className="text-green-800">Vault</span>
          <span className="text-green-500">ify</span>
        </span>

      </div>

      {/* New Button Dropdown */}
      <div className="relative mb-6 px-2" ref={menuRef}>
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="flex items-center gap-3 bg-white border border-slate-200 shadow-md rounded-2xl px-5 py-3.5 text-slate-700 hover:bg-slate-50 hover:shadow-lg hover:text-blue-600 transition-all w-36"
        >
          <Plus size={24} className="text-current" />
          <span className="font-medium">New</span>
        </button>

        {/* Dropdown Menu */}
        {isMenuOpen && (
          <div className="absolute top-16 left-2 w-64 bg-white rounded-lg shadow-xl border border-slate-100 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
            <button
              onClick={() => { onNewFolder(); setIsMenuOpen(false); }}
              className="w-full text-left px-4 py-2.5 hover:bg-slate-100 flex items-center gap-3 text-slate-700 text-sm"
            >
              <FolderPlus size={18} className="text-slate-500" />
              New folder
            </button>
            <div className="my-1 border-b border-slate-100"></div>
            <button
              onClick={() => { onFileUpload(); setIsMenuOpen(false); }}
              className="w-full text-left px-4 py-2.5 hover:bg-slate-100 flex items-center gap-3 text-slate-700 text-sm"
            >
              <FileUp size={18} className="text-slate-500" />
              File upload
            </button>
            <button
              onClick={() => { onFolderUpload(); setIsMenuOpen(false); }}
              className="w-full text-left px-4 py-2.5 hover:bg-slate-100 flex items-center gap-3 text-slate-700 text-sm"
            >
              <FolderUp size={18} className="text-slate-500" />
              Folder upload
            </button>
            <div className="my-1 border-b border-slate-100"></div>
            {/* Mock Apps */}
            <button className="w-full text-left px-4 py-2.5 hover:bg-slate-100 flex items-center gap-3 text-slate-700 text-sm">
              <FileText size={18} className="text-blue-600" />
              Google Docs
            </button>
            <button className="w-full text-left px-4 py-2.5 hover:bg-slate-100 flex items-center gap-3 text-slate-700 text-sm">
              <Table2 size={18} className="text-green-600" />
              Google Sheets
            </button>
            <button className="w-full text-left px-4 py-2.5 hover:bg-slate-100 flex items-center gap-3 text-slate-700 text-sm">
              <Presentation size={18} className="text-yellow-500" />
              Google Slides
            </button>
          </div>
        )}
      </div>

      {/* Menu */}
      <nav className="flex-1 space-y-0.5">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setCurrentView(item.id)}
              className={`flex items-center gap-4 w-full px-4 py-2 rounded-r-full text-sm font-medium transition-colors ${isActive
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-slate-700 hover:bg-slate-100'
                }`}
            >
              <Icon size={18} className={isActive ? 'fill-blue-700/10' : ''} />
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* Storage Widget */}
      <div className="mt-auto pt-6 px-4">
        <div className="flex items-center gap-2 text-slate-600 mb-2">
          <Cloud size={16} className={isStorageCritical ? 'text-red-500' : ''} />
          <span className={`text-sm font-medium ${isStorageCritical ? 'text-red-600' : ''}`}>Storage</span>
        </div>
        <div className="w-full h-1 bg-slate-200 rounded-full overflow-hidden mb-2">
          <div
            className={`h-full rounded-full transition-all duration-500 ${progressBarColor}`}
            style={{ width: `${percentage}%` }}
          ></div>
        </div>
        <p className="text-xs text-slate-500">
          {usedGB} GB of {totalGB} GB used
        </p>
        {/* <button className={`mt-3 text-sm border rounded-lg px-3 py-1.5 w-full text-center hover:bg-slate-50 transition-all font-medium ${isStorageCritical ? 'text-red-600 border-red-200' : 'text-blue-600 border-slate-300 hover:border-blue-200'}`}>
          Get more storage
        </button> */}
      </div>
    </div>
  );
};
