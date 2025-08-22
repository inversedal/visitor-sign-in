import { describe, it, expect, beforeEach } from 'vitest';
import { MemStorage } from '../../server/storage';
import { type InsertVisitor, type InsertAdminUser } from '@shared/schema';

describe('MemStorage', () => {
  let storage: MemStorage;

  beforeEach(() => {
    storage = new MemStorage();
  });

  describe('Visitor Operations', () => {
    it('should create a new visitor', async () => {
      const visitorData: InsertVisitor = {
        name: 'Test Visitor',
        company: 'Test Company',
        hostName: 'Test Host',
        visitReason: 'meeting',
        photoData: null,
      };

      const visitor = await storage.createVisitor(visitorData);

      expect(visitor).toBeDefined();
      expect(visitor.id).toBeDefined();
      expect(visitor.name).toBe('Test Visitor');
      expect(visitor.company).toBe('Test Company');
      expect(visitor.hostName).toBe('Test Host');
      expect(visitor.visitReason).toBe('meeting');
      expect(visitor.isSignedOut).toBe(false);
      expect(visitor.signInTime).toBeDefined();
    });

    it('should get a visitor by ID', async () => {
      const visitorData: InsertVisitor = {
        name: 'Test Visitor',
        company: 'Test Company',
        hostName: 'Test Host',
        visitReason: 'interview',
        photoData: null,
      };

      const created = await storage.createVisitor(visitorData);
      const retrieved = await storage.getVisitor(created.id);

      expect(retrieved).toBeDefined();
      expect(retrieved?.id).toBe(created.id);
      expect(retrieved?.name).toBe('Test Visitor');
    });

    it('should get a visitor by name', async () => {
      const visitorData: InsertVisitor = {
        name: 'Jane Doe',
        company: 'Acme Corp',
        hostName: 'John Smith',
        visitReason: 'delivery',
        photoData: null,
      };

      await storage.createVisitor(visitorData);
      const retrieved = await storage.getVisitorByName('Jane Doe');

      expect(retrieved).toBeDefined();
      expect(retrieved?.name).toBe('Jane Doe');
      expect(retrieved?.company).toBe('Acme Corp');
    });

    it('should sign out a visitor', async () => {
      const visitorData: InsertVisitor = {
        name: 'Sign Out Test',
        company: 'Test Co',
        hostName: 'Host Name',
        visitReason: 'meeting',
        photoData: null,
      };

      const created = await storage.createVisitor(visitorData);
      const signOutTime = new Date();
      const signedOut = await storage.signOutVisitor(created.id, signOutTime);

      expect(signedOut).toBeDefined();
      expect(signedOut?.isSignedOut).toBe(true);
      expect(signedOut?.signOutTime).toEqual(signOutTime);
    });

    it('should get current visitors (not signed out)', async () => {
      // Create one signed in visitor
      await storage.createVisitor({
        name: 'Current Visitor',
        company: 'Company A',
        hostName: 'Host A',
        visitReason: 'meeting',
        photoData: null,
      });

      // Create and sign out another visitor
      const toSignOut = await storage.createVisitor({
        name: 'Past Visitor',
        company: 'Company B',
        hostName: 'Host B',
        visitReason: 'interview',
        photoData: null,
      });
      await storage.signOutVisitor(toSignOut.id, new Date());

      const currentVisitors = await storage.getCurrentVisitors();
      
      // Should have at least the one we created (plus any default test data)
      const ourVisitor = currentVisitors.find(v => v.name === 'Current Visitor');
      expect(ourVisitor).toBeDefined();
      expect(ourVisitor?.isSignedOut).toBe(false);
      
      // Should not include the signed-out visitor
      const pastVisitor = currentVisitors.find(v => v.name === 'Past Visitor');
      expect(pastVisitor).toBeUndefined();
    });

    it('should get all visitors without photos', async () => {
      const visitorData: InsertVisitor = {
        name: 'Photo Test',
        company: 'Photo Co',
        hostName: 'Host',
        visitReason: 'meeting',
        photoData: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
      };

      await storage.createVisitor(visitorData);
      const visitors = await storage.getAllVisitorsWithoutPhotos();
      
      const testVisitor = visitors.find(v => v.name === 'Photo Test');
      expect(testVisitor).toBeDefined();
      expect(testVisitor?.photoData).toBeNull();
    });
  });

  describe('Admin Operations', () => {
    it('should verify admin credentials', async () => {
      // Default admin is created automatically
      const admin = await storage.verifyAdminCredentials('admin', 'admin123');
      
      expect(admin).toBeDefined();
      expect(admin?.username).toBe('admin');
    });

    it('should return null for invalid credentials', async () => {
      const admin = await storage.verifyAdminCredentials('admin', 'wrongpassword');
      
      expect(admin).toBeNull();
    });

    it('should get admin user by username', async () => {
      const admin = await storage.getAdminUserByUsername('admin');
      
      expect(admin).toBeDefined();
      expect(admin?.username).toBe('admin');
    });
  });

  describe('Statistics', () => {
    it('should calculate today stats correctly', async () => {
      // Create some visitors for testing
      await storage.createVisitor({
        name: 'Visitor 1',
        company: 'Company 1',
        hostName: 'Host 1',
        visitReason: 'meeting',
        photoData: null,
      });

      await storage.createVisitor({
        name: 'Visitor 2',
        company: 'Company 2',
        hostName: 'Host 2',
        visitReason: 'interview',
        photoData: null,
      });

      const stats = await storage.getTodayStats();
      
      expect(stats).toBeDefined();
      expect(stats.currentVisitors).toBeGreaterThanOrEqual(2);
      expect(stats.todaySignins).toBeGreaterThanOrEqual(2);
      expect(stats.avgDuration).toBeDefined();
    });
  });

  describe('Audit Logs', () => {
    it('should create audit logs for visitor actions', async () => {
      const visitorData: InsertVisitor = {
        name: 'Audit Test',
        company: 'Audit Co',
        hostName: 'Host',
        visitReason: 'meeting',
        photoData: null,
      };

      const visitor = await storage.createVisitor(visitorData);
      
      const logs = await storage.getAuditLogs();
      const signInLog = logs.find(
        log => log.entityId === visitor.id && log.action === 'VISITOR_SIGN_IN'
      );
      
      expect(signInLog).toBeDefined();
      expect(signInLog?.entityType).toBe('visitor');
    });
  });
});