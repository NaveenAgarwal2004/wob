// frontend/src/components/__tests__/BrowsingHistory.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import BrowsingHistory from '../BrowsingHistory';
import { useBrowsingHistory } from '@/lib/store';

// Mock Next.js Link
jest.mock('next/link', () => {
  return ({ children, href, onClick }: any) => {
    return <a href={href} onClick={onClick}>{children}</a>;
  };
});

// Mock Lucide icons
jest.mock('lucide-react', () => ({
  History: () => <div data-testid="history-icon" />,
  X: () => <div data-testid="x-icon" />,
}));

// Mock Zustand store
jest.mock('@/lib/store', () => ({
  useBrowsingHistory: jest.fn(),
}));

const mockUseBrowsingHistory = useBrowsingHistory as jest.MockedFunction<typeof useBrowsingHistory>;

describe('BrowsingHistory', () => {
  const mockClearHistory = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('does not render when history is empty', () => {
    mockUseBrowsingHistory.mockReturnValue({
      history: [],
      clearHistory: mockClearHistory,
      sessionId: 'test-session',
      addToHistory: jest.fn(),
      loadHistory: jest.fn(),
    });

    const { container } = render(<BrowsingHistory />);
    expect(container.firstChild).toBeNull();
  });

  it('renders toggle button when history exists', () => {
    mockUseBrowsingHistory.mockReturnValue({
      history: [
        { path: '/product/1', title: 'Test Product', timestamp: Date.now() },
      ],
      clearHistory: mockClearHistory,
      sessionId: 'test-session',
      addToHistory: jest.fn(),
      loadHistory: jest.fn(),
    });

    render(<BrowsingHistory />);
    
    expect(screen.getByTestId('history-toggle-btn')).toBeInTheDocument();
    expect(screen.getByTestId('history-icon')).toBeInTheDocument();
  });

  it('opens sidebar when toggle button is clicked', async () => {
    mockUseBrowsingHistory.mockReturnValue({
      history: [
        { path: '/product/1', title: 'Test Product', timestamp: Date.now() },
      ],
      clearHistory: mockClearHistory,
      sessionId: 'test-session',
      addToHistory: jest.fn(),
      loadHistory: jest.fn(),
    });

    render(<BrowsingHistory />);
    
    const toggleBtn = screen.getByTestId('history-toggle-btn');
    fireEvent.click(toggleBtn);

    await waitFor(() => {
      expect(screen.getByTestId('history-sidebar')).toBeInTheDocument();
    });

    expect(screen.getByText('Browsing History')).toBeInTheDocument();
  });

  it('closes sidebar when backdrop is clicked', async () => {
    mockUseBrowsingHistory.mockReturnValue({
      history: [
        { path: '/product/1', title: 'Test Product', timestamp: Date.now() },
      ],
      clearHistory: mockClearHistory,
      sessionId: 'test-session',
      addToHistory: jest.fn(),
      loadHistory: jest.fn(),
    });

    render(<BrowsingHistory />);
    
    // Open sidebar
    fireEvent.click(screen.getByTestId('history-toggle-btn'));
    
    await waitFor(() => {
      expect(screen.getByTestId('history-sidebar')).toBeInTheDocument();
    });

    // Click backdrop
    const backdrop = screen.getByTestId('history-backdrop');
    fireEvent.click(backdrop);

    await waitFor(() => {
      expect(screen.queryByTestId('history-sidebar')).not.toBeInTheDocument();
    });
  });

  it('closes sidebar when close button is clicked', async () => {
    mockUseBrowsingHistory.mockReturnValue({
      history: [
        { path: '/product/1', title: 'Test Product', timestamp: Date.now() },
      ],
      clearHistory: mockClearHistory,
      sessionId: 'test-session',
      addToHistory: jest.fn(),
      loadHistory: jest.fn(),
    });

    render(<BrowsingHistory />);
    
    // Open sidebar
    fireEvent.click(screen.getByTestId('history-toggle-btn'));
    
    await waitFor(() => {
      expect(screen.getByTestId('history-sidebar')).toBeInTheDocument();
    });

    // Click close button
    const closeBtn = screen.getByTestId('history-close-btn');
    fireEvent.click(closeBtn);

    await waitFor(() => {
      expect(screen.queryByTestId('history-sidebar')).not.toBeInTheDocument();
    });
  });

  it('displays history items', async () => {
    const mockHistory = [
      { path: '/product/1', title: 'Product 1', timestamp: Date.now() },
      { path: '/product/2', title: 'Product 2', timestamp: Date.now() - 1000 },
    ];

    mockUseBrowsingHistory.mockReturnValue({
      history: mockHistory,
      clearHistory: mockClearHistory,
      sessionId: 'test-session',
      addToHistory: jest.fn(),
      loadHistory: jest.fn(),
    });

    render(<BrowsingHistory />);
    
    // Open sidebar
    fireEvent.click(screen.getByTestId('history-toggle-btn'));

    await waitFor(() => {
      expect(screen.getByTestId('history-item-0')).toBeInTheDocument();
      expect(screen.getByTestId('history-item-1')).toBeInTheDocument();
    });

    expect(screen.getByText('Product 1')).toBeInTheDocument();
    expect(screen.getByText('Product 2')).toBeInTheDocument();
  });

  it('calls clearHistory when clear button is clicked', async () => {
    mockUseBrowsingHistory.mockReturnValue({
      history: [
        { path: '/product/1', title: 'Test Product', timestamp: Date.now() },
      ],
      clearHistory: mockClearHistory,
      sessionId: 'test-session',
      addToHistory: jest.fn(),
      loadHistory: jest.fn(),
    });

    render(<BrowsingHistory />);
    
    // Open sidebar
    fireEvent.click(screen.getByTestId('history-toggle-btn'));

    await waitFor(() => {
      expect(screen.getByTestId('history-clear-btn')).toBeInTheDocument();
    });

    // Click clear button
    const clearBtn = screen.getByTestId('history-clear-btn');
    fireEvent.click(clearBtn);

    expect(mockClearHistory).toHaveBeenCalled();
  });

  it('displays timestamps for history items', async () => {
    const timestamp = new Date('2024-01-01T12:00:00Z').getTime();
    
    mockUseBrowsingHistory.mockReturnValue({
      history: [
        { path: '/product/1', title: 'Test Product', timestamp },
      ],
      clearHistory: mockClearHistory,
      sessionId: 'test-session',
      addToHistory: jest.fn(),
      loadHistory: jest.fn(),
    });

    render(<BrowsingHistory />);
    
    // Open sidebar
    fireEvent.click(screen.getByTestId('history-toggle-btn'));

    await waitFor(() => {
      const historyItem = screen.getByTestId('history-item-0');
      expect(historyItem).toBeInTheDocument();
    });

    // Check that timestamp is rendered (format may vary by locale)
    expect(screen.getByText(/1\/1\/2024/)).toBeInTheDocument();
  });
});