import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import express from 'express';
import { registerRoutes } from '../../server/routes';
import { MemStorage } from '../../server/storage';

// Mock the storage module
vi.mock('../../server/storage', () => ({
  storage: new MemStorage(),
}));

describe('API Routes', () => {
  let app: express.Express;

  beforeEach(async () => {
    app = express();
    app.use(express.json());
    await registerRoutes(app);
  });

  describe('Visitor Routes', () => {
    it('POST /api/visitors/signin should create a new visitor', async () => {
      const visitorData = {
        name: 'Test Visitor',
        company: 'Test Company',
        hostName: 'Test Host',
        visitReason: 'meeting',
        photoData: null,
      };

      const response = await request(app)
        .post('/api/visitors/signin')
        .send(visitorData)
        .expect(200);

      expect(response.body).toHaveProperty('id');
      expect(response.body.name).toBe('Test Visitor');
      expect(response.body.company).toBe('Test Company');
      expect(response.body.hostName).toBe('Test Host');
      expect(response.body.visitReason).toBe('meeting');
    });

    it('POST /api/visitors/signin should validate required fields', async () => {
      const invalidData = {
        company: 'Test Company',
        visitReason: 'meeting',
      };

      await request(app)
        .post('/api/visitors/signin')
        .send(invalidData)
        .expect(400);
    });

    it('POST /api/visitors/signout should sign out a visitor', async () => {
      const response = await request(app)
        .post('/api/visitors/signout')
        .send({ name: 'John Smith' })
        .expect(200);

      expect(response.body).toHaveProperty('id');
      expect(response.body.isSignedOut).toBe(true);
    });

    it('GET /api/visitors/current should return current visitors', async () => {
      const response = await request(app)
        .get('/api/visitors/current')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe('Admin Routes', () => {
    it('POST /api/admin/login should authenticate admin', async () => {
      const response = await request(app)
        .post('/api/admin/login')
        .send({
          username: 'admin',
          password: 'admin123',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.user).toHaveProperty('username', 'admin');
    });

    it('POST /api/admin/login should reject invalid credentials', async () => {
      await request(app)
        .post('/api/admin/login')
        .send({
          username: 'admin',
          password: 'wrongpassword',
        })
        .expect(401);
    });

    it('GET /api/admin/visitors should require authentication', async () => {
      await request(app)
        .get('/api/admin/visitors')
        .expect(401);
    });

    it('GET /api/admin/stats should require authentication', async () => {
      await request(app)
        .get('/api/admin/stats')
        .expect(401);
    });

    it('GET /api/admin/session should return authentication status', async () => {
      const response = await request(app)
        .get('/api/admin/session')
        .expect(200);

      expect(response.body).toHaveProperty('authenticated');
      expect(response.body.authenticated).toBe(false);
    });
  });

  describe('Protected Admin Routes with Auth', () => {
    let agent: any;

    beforeEach(async () => {
      agent = request.agent(app);
      // Login first
      await agent
        .post('/api/admin/login')
        .send({
          username: 'admin',
          password: 'admin123',
        });
    });

    it('GET /api/admin/visitors should return visitors when authenticated', async () => {
      const response = await agent
        .get('/api/admin/visitors')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    it('GET /api/admin/stats should return stats when authenticated', async () => {
      const response = await agent
        .get('/api/admin/stats')
        .expect(200);

      expect(response.body).toHaveProperty('currentVisitors');
      expect(response.body).toHaveProperty('todaySignins');
      expect(response.body).toHaveProperty('avgDuration');
    });

    it('POST /api/admin/visitors/:id/signout should sign out a visitor', async () => {
      // First create a visitor
      const visitor = await request(app)
        .post('/api/visitors/signin')
        .send({
          name: 'Test Sign Out',
          hostName: 'Host',
          visitReason: 'meeting',
        });

      const response = await agent
        .post(`/api/admin/visitors/${visitor.body.id}/signout`)
        .expect(200);

      expect(response.body.isSignedOut).toBe(true);
    });

    it('POST /api/admin/logout should end the session', async () => {
      await agent
        .post('/api/admin/logout')
        .expect(200);

      // Should not be able to access protected routes after logout
      await agent
        .get('/api/admin/visitors')
        .expect(401);
    });
  });
});