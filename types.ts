export enum FileType {
  FOLDER = 'folder',
  IMAGE = 'image',
  PDF = 'pdf',
  DOC = 'doc',
  VIDEO = 'video',
  AUDIO = 'audio',
  UNKNOWN = 'unknown',
  GDOC = 'gdoc',
  GSHEET = 'gsheet',
  GSLIDE = 'gslide'
}

export interface User {
  id: string;
  email: string;
  name: string;
  password?: string; // Mock only: In production, never store plain passwords
  avatarUrl?: string;
}

export interface FileNode {
  id: string;
  name: string;
  type: FileType;
  size?: number; // bytes
  modifiedAt: Date;
  starred: boolean;
  isTrashed: boolean; // New field for Trash management
  parentId: string | null; // null for root
  ownerId: string; // Changed from 'owner' string to ID for relation
  ownerName: string; // Display name
  sharedWith: string[];
  thumbnailUrl?: string;
}

export interface StorageStats {
  used: number;
  total: number;
  breakdown: {
    name: string;
    value: number;
    color: string;
  }[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
}

// Global declaration for Google Identity Services
declare global {
  interface Window {
    google: {
      accounts: {
        id: {
          initialize: (config: any) => void;
          renderButton: (parent: HTMLElement, options: any) => void;
          prompt: () => void;
        };
      };
    };
  }
}
