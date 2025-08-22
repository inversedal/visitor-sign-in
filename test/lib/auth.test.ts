import { describe, it, expect, vi } from 'vitest';
import { checkAuthStatus, login, logout } from '@/lib/auth';

// Mock fetch
global.fetch = vi.fn();

describe('Auth Library', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('checkAuthStatus', () => {
    it('should return true when authenticated', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ authenticated: true, user: { username: 'admin' } }),
      });

      const result = await checkAuthStatus();
      expect(result).toBe(true);
    });

    it('should return false when not authenticated', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ authenticated: false }),
      });

      const result = await checkAuthStatus();
      expect(result).toBe(false);
    });

    it('should handle fetch errors gracefully', async () => {
      (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

      const result = await checkAuthStatus();
      expect(result).toBe(false);
    });
  });

  describe('login', () => {
    it('should return user data on successful login', async () => {
      const mockUser = { id: '1', username: 'admin' };
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, user: mockUser }),
      });

      const result = await login('admin', 'admin123');
      expect(result).toEqual({ success: true, user: mockUser });
    });

    it('should handle invalid credentials', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 401,
        text: async () => 'Invalid credentials',
      });

      await expect(login('admin', 'wrong')).rejects.toThrow('401');
    });
  });

  describe('logout', () => {
    it('should logout successfully', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      await logout();
      expect(global.fetch).toHaveBeenCalledWith('/api/admin/logout', {
        method: 'POST',
        credentials: 'include',
      });
    });

    it('should handle logout errors', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: async () => 'Server error',
      });

      await expect(logout()).rejects.toThrow('500');
    });
  });
});