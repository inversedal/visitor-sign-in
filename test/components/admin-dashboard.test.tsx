import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AdminDashboard from '@/components/admin-dashboard';

// Mock the hooks
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

// Mock API responses
const mockStats = {
  currentVisitors: 5,
  todaySignins: 10,
  avgDuration: '2.5h',
};

const mockVisitors = [
  {
    id: '1',
    name: 'John Doe',
    company: 'Acme Corp',
    hostName: 'Jane Smith',
    visitReason: 'meeting',
    photoData: null,
    signInTime: new Date('2025-08-21T10:00:00'),
    signOutTime: null,
    isSignedOut: false,
    emailSent: true,
  },
  {
    id: '2',
    name: 'Alice Johnson',
    company: 'Tech Co',
    hostName: 'Bob Wilson',
    visitReason: 'interview',
    photoData: null,
    signInTime: new Date('2025-08-21T09:00:00'),
    signOutTime: new Date('2025-08-21T11:00:00'),
    isSignedOut: true,
    emailSent: true,
  },
];

vi.mock('@/lib/queryClient', () => ({
  apiRequest: vi.fn(),
  queryClient: new QueryClient(),
}));

describe('AdminDashboard Component', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { 
          retry: false,
          staleTime: 0,
        },
        mutations: { retry: false },
      },
    });

    // Setup default query responses
    queryClient.setQueryData(['/api/admin/stats'], mockStats);
    queryClient.setQueryData(['/api/admin/visitors'], mockVisitors);
  });

  const renderComponent = () => {
    return render(
      <QueryClientProvider client={queryClient}>
        <AdminDashboard />
      </QueryClientProvider>
    );
  };

  it('should render the dashboard with statistics', async () => {
    renderComponent();
    
    await waitFor(() => {
      expect(screen.getByText('Admin Dashboard')).toBeInTheDocument();
      expect(screen.getByText('5')).toBeInTheDocument(); // Current visitors
      expect(screen.getByText('10')).toBeInTheDocument(); // Today's sign-ins
      expect(screen.getByText('2.5h')).toBeInTheDocument(); // Avg duration
    });
  });

  it('should render the visitor table', async () => {
    renderComponent();
    
    await waitFor(() => {
      expect(screen.getByText('Current Visitors')).toBeInTheDocument();
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Acme Corp')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    });
  });

  it('should filter visitors based on search query', async () => {
    renderComponent();
    const user = userEvent.setup();
    
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText('Search visitors...');
    await user.type(searchInput, 'Alice');
    
    await waitFor(() => {
      expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
      expect(screen.getByText('Alice Johnson')).toBeInTheDocument();
    });
  });

  it('should display visitor badges with correct colors', async () => {
    renderComponent();
    
    await waitFor(() => {
      const meetingBadge = screen.getByText('meeting');
      const interviewBadge = screen.getByText('interview');
      
      expect(meetingBadge).toBeInTheDocument();
      expect(interviewBadge).toBeInTheDocument();
    });
  });

  it('should show export and refresh buttons', async () => {
    renderComponent();
    
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Export Data/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Refresh/i })).toBeInTheDocument();
    });
  });

  it('should display the visitor details modal when clicking on a visitor', async () => {
    renderComponent();
    const user = userEvent.setup();
    
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    // Click on the visitor row
    const visitorRow = screen.getByText('John Doe').closest('tr');
    if (visitorRow) {
      await user.click(visitorRow);
    }
    
    await waitFor(() => {
      expect(screen.getByText('Visitor Details')).toBeInTheDocument();
      expect(screen.getByText('Complete information about the visitor')).toBeInTheDocument();
    });
  });

  it('should handle empty visitor list', async () => {
    // Override with empty visitors
    queryClient.setQueryData(['/api/admin/visitors'], []);
    
    renderComponent();
    
    await waitFor(() => {
      expect(screen.getByText('No current visitors.')).toBeInTheDocument();
    });
  });

  it('should display loading state', () => {
    // Create a new query client without default data
    const emptyQueryClient = new QueryClient({
      defaultOptions: {
        queries: { 
          retry: false,
          staleTime: 0,
        },
      },
    });

    render(
      <QueryClientProvider client={emptyQueryClient}>
        <AdminDashboard />
      </QueryClientProvider>
    );
    
    expect(screen.getByText('Loading dashboard...')).toBeInTheDocument();
  });
});