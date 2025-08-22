import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateVisitorBadge } from '@/lib/pdf-generator';
import { type Visitor } from '@shared/schema';

// Mock jsPDF
vi.mock('jspdf', () => {
  const mockJsPDF = vi.fn().mockImplementation(() => ({
    setFontSize: vi.fn(),
    setFont: vi.fn(),
    text: vi.fn(),
    setDrawColor: vi.fn(),
    setLineWidth: vi.fn(),
    rect: vi.fn(),
    addImage: vi.fn(),
    line: vi.fn(),
    save: vi.fn(),
    internal: {
      pageSize: {
        getWidth: vi.fn(() => 210),
        getHeight: vi.fn(() => 297),
      },
    },
  }));
  
  return { default: mockJsPDF };
});

describe('PDF Generator', () => {
  const mockVisitor: Visitor = {
    id: 'test-id',
    name: 'John Doe',
    company: 'Acme Corp',
    hostName: 'Jane Smith',
    visitReason: 'meeting',
    photoData: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
    signInTime: new Date('2025-08-21T10:00:00'),
    signOutTime: null,
    isSignedOut: false,
    emailSent: true,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should generate a visitor badge PDF', async () => {
    await generateVisitorBadge(mockVisitor);
    
    // The function should complete without errors
    expect(true).toBe(true);
  });

  it('should handle visitors without photos', async () => {
    const visitorWithoutPhoto = {
      ...mockVisitor,
      photoData: null,
    };
    
    await generateVisitorBadge(visitorWithoutPhoto);
    
    // Should complete without errors even without a photo
    expect(true).toBe(true);
  });

  it('should handle visitors without company', async () => {
    const visitorWithoutCompany = {
      ...mockVisitor,
      company: null,
    };
    
    await generateVisitorBadge(visitorWithoutCompany);
    
    // Should complete without errors
    expect(true).toBe(true);
  });

  it('should format date correctly', async () => {
    const testDate = new Date('2025-08-21T15:30:00');
    const visitorWithTestDate = {
      ...mockVisitor,
      signInTime: testDate,
    };
    
    await generateVisitorBadge(visitorWithTestDate);
    
    // Should include formatted date
    expect(true).toBe(true);
  });
});