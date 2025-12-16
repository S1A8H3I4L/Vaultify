import { FileNode, FileType, User } from "../types";
import { MOCK_FILES, MOCK_USERS, TOTAL_STORAGE } from "../constants";

// Keys for LocalStorage
const STORAGE_KEY_FILES = 'vaultify_files_v1';
const STORAGE_KEY_USERS = 'vaultify_users_v1';

class DatabaseService {
  private files: FileNode[];
  private users: User[];

  constructor() {
    // Initialize from LocalStorage or fall back to MOCK data
    const storedFiles = localStorage.getItem(STORAGE_KEY_FILES);
    const storedUsers = localStorage.getItem(STORAGE_KEY_USERS);

    this.files = storedFiles ? JSON.parse(storedFiles) : [...MOCK_FILES];
    this.users = storedUsers ? JSON.parse(storedUsers) : [...MOCK_USERS];
    
    // Convert date strings back to Date objects if loaded from JSON
    this.files.forEach(f => f.modifiedAt = new Date(f.modifiedAt));
  }

  private save() {
    localStorage.setItem(STORAGE_KEY_FILES, JSON.stringify(this.files));
    localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(this.users));
  }

  // --- USER METHODS ---
  
  userExists(email: string): boolean {
    return this.users.some(u => u.email.toLowerCase() === email.toLowerCase());
  }

  authenticate(email: string, password?: string): User | null {
    // Find user
    const user = this.users.find(u => u.email.toLowerCase() === email.toLowerCase());
    
    // If no user found
    if (!user) return null;

    // If password provided, check it (Simple string comparison for mock)
    // In production, use bcrypt/argon2
    if (password && user.password !== password) {
        return null; 
    }

    return user;
  }

  createUser(user: User): User {
    if (this.userExists(user.email)) {
      throw new Error("User already exists");
    }
    
    // Ensure unique ID if not provided or collision
    if (!user.id || this.users.some(u => u.id === user.id)) {
        user.id = `u${Date.now()}`;
    }

    this.users.push(user);
    this.save();
    return user;
  }

  // --- FILE METHODS (SECURE) ---

  getFiles(userId: string): FileNode[] {
    // Return files owned by user OR shared with user (via email)
    const user = this.users.find(u => u.id === userId);
    if (!user) return [];
    
    return this.files.filter(f => 
      f.ownerId === userId || f.sharedWith.includes(user.email)
    );
  }

  // Helper to find a specific folder by name and parent for folder uploads
  findFolder(name: string, parentId: string | null, userId: string): FileNode | undefined {
    return this.files.find(f => 
        f.name === name && 
        f.parentId === parentId && 
        f.type === FileType.FOLDER &&
        f.ownerId === userId &&
        !f.isTrashed
    );
  }

  createFile(file: FileNode, userId: string): FileNode {
    // Verify Quota
    const usage = this.getStorageUsage(userId);
    if (usage + (file.size || 0) > TOTAL_STORAGE) {
      throw new Error("Storage quota exceeded");
    }

    // Security check: Ensure the creator matches the userId provided
    if (file.ownerId !== userId) {
      throw new Error("Security Violation: Cannot create file for another user");
    }

    this.files.push(file);
    this.save();
    return file;
  }

  updateFile(fileId: string, updates: Partial<FileNode>, userId: string): FileNode {
    const index = this.files.findIndex(f => f.id === fileId);
    if (index === -1) throw new Error("File not found");

    const file = this.files[index];

    // Security Check: Only owner can update metadata (like name, trash status)
    // In a real app, editors might have some rights, but ownership is strict for deletion
    if (file.ownerId !== userId && !file.sharedWith.includes(this.getUserEmail(userId))) {
       throw new Error("Access Denied");
    }

    const updatedFile = { ...file, ...updates, modifiedAt: new Date() };
    this.files[index] = updatedFile;
    this.save();
    return updatedFile;
  }

  // Bulk share function
  shareFiles(fileIds: string[], email: string, userId: string): void {
    fileIds.forEach(id => {
      const index = this.files.findIndex(f => f.id === id);
      if (index !== -1) {
        const file = this.files[index];
        // Only owner can share
        if (file.ownerId === userId) {
           // Add email if not already present
           if (!file.sharedWith.includes(email)) {
              this.files[index] = {
                ...file,
                sharedWith: [...file.sharedWith, email],
                modifiedAt: new Date()
              };
           }
        }
      }
    });
    this.save();
  }

  deleteFile(fileId: string, userId: string): void {
    const index = this.files.findIndex(f => f.id === fileId);
    if (index === -1) return; // Already gone

    const file = this.files[index];
    
    // Strict Ownership Check for permanent deletion
    if (file.ownerId !== userId) {
      throw new Error("Access Denied: Only the owner can permanently delete files");
    }

    // If it's a folder, delete children (Simulated Cascade)
    if (file.type === FileType.FOLDER) {
        const children = this.files.filter(f => f.parentId === file.id);
        children.forEach(c => this.deleteFile(c.id, userId));
    }

    this.files.splice(index, 1);
    this.save();
  }

  getStorageUsage(userId: string): number {
    return this.files
      .filter(f => f.ownerId === userId && !f.isTrashed) // Trashed files often count, but let's say they don't for this logic
      .reduce((acc, curr) => acc + (curr.size || 0), 0);
  }

  // Helper
  private getUserEmail(userId: string): string {
    return this.users.find(u => u.id === userId)?.email || '';
  }
}

// Export a singleton instance
export const db = new DatabaseService();