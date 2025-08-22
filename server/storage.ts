import { type Visitor, type InsertVisitor, type AdminUser, type InsertAdminUser, type AuditLog, type InsertAuditLog } from "@shared/schema";
import { randomUUID } from "crypto";
import bcrypt from "bcrypt";

export interface IStorage {
  // Visitor operations
  getVisitor(id: string): Promise<Visitor | undefined>;
  getVisitorByName(name: string): Promise<Visitor | undefined>;
  createVisitor(visitor: InsertVisitor): Promise<Visitor>;
  updateVisitor(id: string, updates: Partial<Visitor>): Promise<Visitor | undefined>;
  getCurrentVisitors(): Promise<Visitor[]>;
  getAllVisitors(): Promise<Visitor[]>;
  getAllVisitorsWithoutPhotos(): Promise<Visitor[]>;
  signOutVisitor(id: string, signOutTime: Date): Promise<Visitor | undefined>;
  signOutVisitorByName(name: string, signOutTime: Date): Promise<Visitor | undefined>;
  
  // Admin operations
  getAdminUser(id: string): Promise<AdminUser | undefined>;
  getAdminUserByUsername(username: string): Promise<AdminUser | undefined>;
  createAdminUser(user: InsertAdminUser): Promise<AdminUser>;
  verifyAdminCredentials(username: string, password: string): Promise<AdminUser | null>;
  
  // Audit operations
  createAuditLog(log: InsertAuditLog): Promise<AuditLog>;
  getAuditLogs(): Promise<AuditLog[]>;
  
  // Stats
  getTodayStats(): Promise<{
    currentVisitors: number;
    todaySignins: number;
    avgDuration: string;
  }>;
}

export class MemStorage implements IStorage {
  private visitors: Map<string, Visitor>;
  private adminUsers: Map<string, AdminUser>;
  private auditLogs: Map<string, AuditLog>;

  constructor() {
    this.visitors = new Map();
    this.adminUsers = new Map();
    this.auditLogs = new Map();
    
    // Create default admin user
    this.initializeDefaultAdmin();
  }

  private async initializeDefaultAdmin() {
    const hashedPassword = await bcrypt.hash("admin123", 10);
    const defaultAdmin: AdminUser = {
      id: randomUUID(),
      username: "admin",
      password: hashedPassword,
      createdAt: new Date(),
    };
    this.adminUsers.set(defaultAdmin.id, defaultAdmin);
    
    // Add some sample visitors for testing
    this.initializeSampleVisitors();
  }
  
  private initializeSampleVisitors() {
    // Add sample visitors to demonstrate functionality
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);
    
    // Current visitor 1
    const visitor1: Visitor = {
      id: randomUUID(),
      name: "John Smith",
      company: "Tech Solutions Inc",
      hostName: "Sarah Johnson",
      visitReason: "meeting",
      photoData: null,
      signInTime: oneHourAgo,
      signOutTime: null,
      isSignedOut: false,
      emailSent: true,
    };
    this.visitors.set(visitor1.id, visitor1);
    
    // Current visitor 2
    const visitor2: Visitor = {
      id: randomUUID(),
      name: "Emily Chen",
      company: "Design Studio",
      hostName: "Mike Williams",
      visitReason: "interview",
      photoData: null,
      signInTime: new Date(now.getTime() - 30 * 60 * 1000), // 30 minutes ago
      signOutTime: null,
      isSignedOut: false,
      emailSent: true,
    };
    this.visitors.set(visitor2.id, visitor2);
    
    // Signed out visitor
    const visitor3: Visitor = {
      id: randomUUID(),
      name: "Robert Brown",
      company: "Consulting Group",
      hostName: "Lisa Davis",
      visitReason: "delivery",
      photoData: null,
      signInTime: twoHoursAgo,
      signOutTime: oneHourAgo,
      isSignedOut: true,
      emailSent: true,
    };
    this.visitors.set(visitor3.id, visitor3);
    
    console.log(`Initialized ${this.visitors.size} sample visitors for testing`);
  }

  async getVisitor(id: string): Promise<Visitor | undefined> {
    return this.visitors.get(id);
  }

  async getVisitorByName(name: string): Promise<Visitor | undefined> {
    return Array.from(this.visitors.values()).find(
      (visitor) => visitor.name.toLowerCase() === name.toLowerCase() && !visitor.isSignedOut
    );
  }

  async createVisitor(insertVisitor: InsertVisitor): Promise<Visitor> {
    const id = randomUUID();
    const visitor: Visitor = {
      id,
      name: insertVisitor.name,
      company: insertVisitor.company || null,
      hostName: insertVisitor.hostName,
      visitReason: insertVisitor.visitReason,
      photoData: insertVisitor.photoData || null,
      signInTime: new Date(),
      signOutTime: null,
      isSignedOut: false,
      emailSent: false,
    };
    this.visitors.set(id, visitor);
    
    await this.createAuditLog({
      action: "VISITOR_SIGN_IN",
      entityType: "visitor",
      entityId: id,
      userId: null,
      details: { name: visitor.name, company: visitor.company, hostName: visitor.hostName },
    });
    
    return visitor;
  }

  async updateVisitor(id: string, updates: Partial<Visitor>): Promise<Visitor | undefined> {
    const visitor = this.visitors.get(id);
    if (!visitor) return undefined;
    
    const updatedVisitor = { ...visitor, ...updates };
    this.visitors.set(id, updatedVisitor);
    
    await this.createAuditLog({
      action: "VISITOR_UPDATED",
      entityType: "visitor",
      entityId: id,
      userId: null,
      details: updates,
    });
    
    return updatedVisitor;
  }

  async getCurrentVisitors(): Promise<Visitor[]> {
    return Array.from(this.visitors.values()).filter(
      (visitor) => !visitor.isSignedOut
    );
  }

  async getAllVisitors(): Promise<Visitor[]> {
    return Array.from(this.visitors.values());
  }
  
  async getAllVisitorsWithoutPhotos(): Promise<Visitor[]> {
    return Array.from(this.visitors.values()).map(visitor => ({
      ...visitor,
      photoData: null // Exclude photo data to reduce payload size
    }));
  }

  async signOutVisitor(id: string, signOutTime: Date): Promise<Visitor | undefined> {
    const visitor = this.visitors.get(id);
    if (!visitor) return undefined;
    
    const updatedVisitor = {
      ...visitor,
      signOutTime,
      isSignedOut: true,
    };
    this.visitors.set(id, updatedVisitor);
    
    await this.createAuditLog({
      action: "VISITOR_SIGN_OUT",
      entityType: "visitor",
      entityId: id,
      userId: null,
      details: { name: visitor.name, signOutTime },
    });
    
    return updatedVisitor;
  }

  async signOutVisitorByName(name: string, signOutTime: Date): Promise<Visitor | undefined> {
    const visitor = Array.from(this.visitors.values()).find(
      (v) => v.name.toLowerCase() === name.toLowerCase() && !v.isSignedOut
    );
    
    if (!visitor) return undefined;
    
    return this.signOutVisitor(visitor.id, signOutTime);
  }

  async getAdminUser(id: string): Promise<AdminUser | undefined> {
    return this.adminUsers.get(id);
  }

  async getAdminUserByUsername(username: string): Promise<AdminUser | undefined> {
    return Array.from(this.adminUsers.values()).find(
      (user) => user.username === username
    );
  }

  async createAdminUser(insertUser: InsertAdminUser): Promise<AdminUser> {
    const id = randomUUID();
    const hashedPassword = await bcrypt.hash(insertUser.password, 10);
    const user: AdminUser = {
      ...insertUser,
      id,
      password: hashedPassword,
      createdAt: new Date(),
    };
    this.adminUsers.set(id, user);
    return user;
  }

  async verifyAdminCredentials(username: string, password: string): Promise<AdminUser | null> {
    const user = await this.getAdminUserByUsername(username);
    if (!user) return null;
    
    const isValid = await bcrypt.compare(password, user.password);
    return isValid ? user : null;
  }

  async createAuditLog(insertLog: InsertAuditLog): Promise<AuditLog> {
    const id = randomUUID();
    const log: AuditLog = {
      id,
      action: insertLog.action,
      entityType: insertLog.entityType,
      entityId: insertLog.entityId,
      userId: insertLog.userId || null,
      details: insertLog.details || null,
      timestamp: new Date(),
    };
    this.auditLogs.set(id, log);
    return log;
  }

  async getAuditLogs(): Promise<AuditLog[]> {
    return Array.from(this.auditLogs.values()).sort(
      (a, b) => b.timestamp.getTime() - a.timestamp.getTime()
    );
  }

  async getTodayStats(): Promise<{
    currentVisitors: number;
    todaySignins: number;
    avgDuration: string;
  }> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const allVisitors = Array.from(this.visitors.values());
    const currentVisitors = allVisitors.filter(v => !v.isSignedOut).length;
    const todaySignins = allVisitors.filter(v => v.signInTime >= today).length;
    
    // Calculate average duration for completed visits
    const completedVisits = allVisitors.filter(v => v.isSignedOut && v.signOutTime);
    const totalDuration = completedVisits.reduce((acc, v) => {
      if (v.signOutTime) {
        return acc + (v.signOutTime.getTime() - v.signInTime.getTime());
      }
      return acc;
    }, 0);
    
    const avgDurationMs = completedVisits.length > 0 ? totalDuration / completedVisits.length : 0;
    const avgDurationHours = (avgDurationMs / (1000 * 60 * 60)).toFixed(1);
    
    return {
      currentVisitors,
      todaySignins,
      avgDuration: `${avgDurationHours}h`,
    };
  }
}

export const storage = new MemStorage();
