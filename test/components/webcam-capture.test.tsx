import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import WebcamCapture from '@/components/webcam-capture';

// Mock getUserMedia
const mockGetUserMedia = vi.fn();
global.navigator.mediaDevices = {
  getUserMedia: mockGetUserMedia,
} as any;

// Mock URL methods
global.URL.createObjectURL = vi.fn(() => 'mock-url');
global.URL.revokeObjectURL = vi.fn();

describe('WebcamCapture Component', () => {
  const mockOnCapture = vi.fn();
  const mockOnSkip = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUserMedia.mockResolvedValue({
      getTracks: () => [{
        stop: vi.fn(),
      }],
    });
  });

  it('should render the component with capture buttons', () => {
    render(
      <WebcamCapture 
        onCapture={mockOnCapture}
        onSkip={mockOnSkip}
      />
    );

    expect(screen.getByText('Take Photo')).toBeInTheDocument();
    expect(screen.getByText('Skip Photo')).toBeInTheDocument();
  });

  it('should request camera permissions on mount', async () => {
    render(
      <WebcamCapture 
        onCapture={mockOnCapture}
        onSkip={mockOnSkip}
      />
    );

    await waitFor(() => {
      expect(mockGetUserMedia).toHaveBeenCalledWith({
        video: { width: 1280, height: 720 },
        audio: false,
      });
    });
  });

  it('should show error message when camera access is denied', async () => {
    mockGetUserMedia.mockRejectedValueOnce(new Error('Permission denied'));

    render(
      <WebcamCapture 
        onCapture={mockOnCapture}
        onSkip={mockOnSkip}
      />
    );

    await waitFor(() => {
      expect(screen.getByText(/Unable to access camera/i)).toBeInTheDocument();
    });
  });

  it('should allow uploading a photo when camera is not available', async () => {
    mockGetUserMedia.mockRejectedValueOnce(new Error('No camera'));

    render(
      <WebcamCapture 
        onCapture={mockOnCapture}
        onSkip={mockOnSkip}
      />
    );

    await waitFor(() => {
      const uploadInput = screen.getByLabelText(/Upload a photo instead/i);
      expect(uploadInput).toBeInTheDocument();
    });
  });

  it('should call onSkip when skip button is clicked', async () => {
    render(
      <WebcamCapture 
        onCapture={mockOnCapture}
        onSkip={mockOnSkip}
      />
    );

    const skipButton = screen.getByText('Skip Photo');
    fireEvent.click(skipButton);

    expect(mockOnSkip).toHaveBeenCalled();
  });

  it('should handle file upload', async () => {
    mockGetUserMedia.mockRejectedValueOnce(new Error('No camera'));
    
    render(
      <WebcamCapture 
        onCapture={mockOnCapture}
        onSkip={mockOnSkip}
      />
    );

    await waitFor(() => {
      expect(screen.getByLabelText(/Upload a photo instead/i)).toBeInTheDocument();
    });

    const file = new File(['test'], 'test.png', { type: 'image/png' });
    const input = screen.getByLabelText(/Upload a photo instead/i) as HTMLInputElement;
    
    Object.defineProperty(input, 'files', {
      value: [file],
      writable: false,
    });

    fireEvent.change(input);

    // Mock FileReader
    const mockFileReader = {
      readAsDataURL: vi.fn(),
      onload: null as any,
      result: 'data:image/png;base64,test',
    };
    
    global.FileReader = vi.fn(() => mockFileReader) as any;
    
    fireEvent.change(input);
    
    // Simulate FileReader onload
    if (mockFileReader.onload) {
      mockFileReader.onload({ target: { result: 'data:image/png;base64,test' } });
    }
  });
});