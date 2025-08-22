import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import VisitorSignIn from '@/components/visitor-signin';

// Mock the toast hook
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

// Mock the API request
vi.mock('@/lib/queryClient', () => ({
  apiRequest: vi.fn(),
}));

// Mock the pdf generator
vi.mock('@/lib/pdf-generator', () => ({
  generateVisitorBadge: vi.fn(() => Promise.resolve()),
}));

describe('VisitorSignIn Component', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
  });

  const renderComponent = () => {
    return render(
      <QueryClientProvider client={queryClient}>
        <VisitorSignIn />
      </QueryClientProvider>
    );
  };

  it('should render the sign-in form', () => {
    renderComponent();
    
    expect(screen.getByText('Visitor Sign-In')).toBeInTheDocument();
    expect(screen.getByLabelText(/Full Name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Company/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Host Name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Purpose of Visit/i)).toBeInTheDocument();
  });

  it('should show validation errors for empty required fields', async () => {
    renderComponent();
    const user = userEvent.setup();
    
    const submitButton = screen.getByRole('button', { name: /Sign In/i });
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/Name is required/i)).toBeInTheDocument();
    });
  });

  it('should accept valid input in all fields', async () => {
    renderComponent();
    const user = userEvent.setup();
    
    const nameInput = screen.getByLabelText(/Full Name/i);
    const companyInput = screen.getByLabelText(/Company/i);
    const hostInput = screen.getByLabelText(/Host Name/i);
    const purposeSelect = screen.getByLabelText(/Purpose of Visit/i);
    
    await user.type(nameInput, 'John Doe');
    await user.type(companyInput, 'Acme Corp');
    await user.type(hostInput, 'Jane Smith');
    
    fireEvent.click(purposeSelect);
    const meetingOption = await screen.findByText('Meeting');
    fireEvent.click(meetingOption);
    
    expect(nameInput).toHaveValue('John Doe');
    expect(companyInput).toHaveValue('Acme Corp');
    expect(hostInput).toHaveValue('Jane Smith');
  });

  it('should handle photo capture step', async () => {
    renderComponent();
    const user = userEvent.setup();
    
    // Fill in required fields
    await user.type(screen.getByLabelText(/Full Name/i), 'John Doe');
    await user.type(screen.getByLabelText(/Host Name/i), 'Jane Smith');
    
    const purposeSelect = screen.getByLabelText(/Purpose of Visit/i);
    fireEvent.click(purposeSelect);
    const meetingOption = await screen.findByText('Meeting');
    fireEvent.click(meetingOption);
    
    // Click next to go to photo capture
    const nextButton = screen.getByRole('button', { name: /Next/i });
    await user.click(nextButton);
    
    await waitFor(() => {
      expect(screen.getByText(/Take Your Photo/i)).toBeInTheDocument();
    });
  });

  it('should display sign-out form', async () => {
    renderComponent();
    const user = userEvent.setup();
    
    const signOutTab = screen.getByRole('tab', { name: /Sign Out/i });
    await user.click(signOutTab);
    
    expect(screen.getByText('Visitor Sign-Out')).toBeInTheDocument();
    expect(screen.getByLabelText(/Enter your full name to sign out/i)).toBeInTheDocument();
  });

  it('should validate sign-out name field', async () => {
    renderComponent();
    const user = userEvent.setup();
    
    const signOutTab = screen.getByRole('tab', { name: /Sign Out/i });
    await user.click(signOutTab);
    
    const signOutButton = screen.getByRole('button', { name: /Sign Out/i });
    await user.click(signOutButton);
    
    await waitFor(() => {
      expect(screen.getByText(/Name is required/i)).toBeInTheDocument();
    });
  });
});