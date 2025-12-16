import { FileNode, FileType, User } from "./types";

export const MOCK_USERS: User[] = [
  {
    id: 'u1',
    email: 'demo@vaultify.com',
    name: 'Demo User',
    password: 'password123', // Mock password
    avatarUrl: 'https://ui-avatars.com/api/?name=Demo+User&background=3b82f6&color=fff'
  },
  {
    id: 'u2',
    email: 'alice@company.com',
    name: 'Alice Smith',
    password: 'password123',
    avatarUrl: 'https://ui-avatars.com/api/?name=Alice+Smith&background=10b981&color=fff'
  }
];

export const MOCK_FILES: FileNode[] = [
  {
    id: '1',
    name: 'Project Alpha Docs',
    type: FileType.FOLDER,
    modifiedAt: new Date('2023-10-25T10:00:00'),
    starred: true,
    isTrashed: false,
    parentId: null,
    ownerId: 'u1',
    ownerName: 'Demo User',
    sharedWith: []
  },
  {
    id: '2',
    name: 'Q3 Financial Report.pdf',
    type: FileType.PDF,
    size: 2500000,
    modifiedAt: new Date('2023-10-24T14:30:00'),
    starred: false,
    isTrashed: false,
    parentId: null,
    ownerId: 'u1',
    ownerName: 'Demo User',
    sharedWith: ['alice@company.com']
  },
  {
    id: '3',
    name: 'Design Assets',
    type: FileType.FOLDER,
    modifiedAt: new Date('2023-10-20T09:15:00'),
    starred: false,
    isTrashed: false,
    parentId: null,
    ownerId: 'u1',
    ownerName: 'Demo User',
    sharedWith: []
  },
  {
    id: '4',
    name: 'Logo_Final.png',
    type: FileType.IMAGE,
    size: 1024000,
    modifiedAt: new Date('2023-10-22T11:20:00'),
    starred: true,
    isTrashed: false,
    parentId: '3', // Inside Design Assets
    ownerId: 'u1',
    ownerName: 'Demo User',
    sharedWith: [],
    thumbnailUrl: 'https://picsum.photos/200/200'
  },
  {
    id: '5',
    name: 'Team_Outing.mp4',
    type: FileType.VIDEO,
    size: 45000000,
    modifiedAt: new Date('2023-09-15T16:45:00'),
    starred: false,
    isTrashed: false,
    parentId: null,
    ownerId: 'u1',
    ownerName: 'Demo User',
    sharedWith: []
  },
  {
    id: '6',
    name: 'Meeting Notes.doc',
    type: FileType.DOC,
    size: 50000,
    modifiedAt: new Date('2023-10-26T09:00:00'),
    starred: false,
    isTrashed: false,
    parentId: '1',
    ownerId: 'u1',
    ownerName: 'Demo User',
    sharedWith: []
  },
  {
    id: '7',
    name: 'Budget_2024.pdf',
    type: FileType.PDF,
    size: 1200000,
    modifiedAt: new Date('2023-10-26T09:30:00'),
    starred: true,
    isTrashed: false,
    parentId: '1',
    ownerId: 'u1',
    ownerName: 'Demo User',
    sharedWith: []
  },
  {
    id: '8',
    name: 'Old_Proposal.docx',
    type: FileType.DOC,
    size: 30000,
    modifiedAt: new Date('2023-01-10T09:30:00'),
    starred: false,
    isTrashed: true,
    parentId: null,
    ownerId: 'u1',
    ownerName: 'Demo User',
    sharedWith: []
  }
];

export const TOTAL_STORAGE = 15 * 1024 * 1024 * 1024; // 15GB
