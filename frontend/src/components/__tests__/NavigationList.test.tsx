// frontend/src/components/__tests__/NavigationList.test.tsx
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import NavigationList from '../NavigationList';
import { Navigation } from '@/lib/types';

// Mock SWR
jest.mock('swr', () => ({
  __esModule: true,
  default: jest.fn(),
}));

// Mock Next.js Link
jest.mock('next/link', () => {
  return ({ children, href }: any) => {
    return <a href={href}>{children}</a>;
  };
});

// Mock Lucide icons
jest.mock('lucide-react', () => ({
  ChevronRight: () => <div data-testid="chevron-right" />,
  Loader2: () => <div data-testid="loader" />,
}));

import useSWR from 'swr';

const mockUseSWR = useSWR as jest.MockedFunction<typeof useSWR>;

describe('NavigationList', () => {
  const mockNavigations: Navigation[] = [
    {
      id: '1',
      title: 'Books',
      slug: 'books',
      sourceUrl: 'https://example.com/books',
      lastScrapedAt: '2024-01-01T00:00:00Z',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    },
    {
      id: '2',
      title: "Children's Books",
      slug: 'childrens-books',
      sourceUrl: 'https://example.com/childrens',
      lastScrapedAt: '2024-01-01T00:00:00Z',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    },
  ];

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders loading state', () => {
    mockUseSWR.mockReturnValue({
      data: undefined,
      error: undefined,
      isLoading: true,
      isValidating: false,
      mutate: jest.fn(),
    } as any);

    render(<NavigationList />);
    
    expect(screen.getByTestId('navigation-loading')).toBeInTheDocument();
    expect(screen.getByTestId('loader')).toBeInTheDocument();
  });

  it('renders error state', () => {
    mockUseSWR.mockReturnValue({
      data: undefined,
      error: new Error('Failed to fetch'),
      isLoading: false,
      isValidating: false,
      mutate: jest.fn(),
    } as any);

    render(<NavigationList />);
    
    expect(screen.getByTestId('navigation-error')).toBeInTheDocument();
    expect(screen.getByText(/Failed to load navigations/i)).toBeInTheDocument();
  });

  it('renders empty state', () => {
    mockUseSWR.mockReturnValue({
      data: [],
      error: undefined,
      isLoading: false,
      isValidating: false,
      mutate: jest.fn(),
    } as any);

    render(<NavigationList />);
    
    expect(screen.getByTestId('navigation-empty')).toBeInTheDocument();
    expect(screen.getByText(/No navigations found/i)).toBeInTheDocument();
  });

  it('renders navigation cards', async () => {
    mockUseSWR.mockReturnValue({
      data: mockNavigations,
      error: undefined,
      isLoading: false,
      isValidating: false,
      mutate: jest.fn(),
    } as any);

    render(<NavigationList />);
    
    await waitFor(() => {
      expect(screen.getByTestId('navigation-list')).toBeInTheDocument();
    });

    // Check for navigation titles instead of card IDs
    expect(screen.getByText('Books')).toBeInTheDocument();
    expect(screen.getByText("Children's Books")).toBeInTheDocument();
    
    // Check that the titles have correct test IDs
    expect(screen.getByTestId('navigation-title-1')).toBeInTheDocument();
    expect(screen.getByTestId('navigation-title-2')).toBeInTheDocument();
  });

  it('displays last scraped date', async () => {
    mockUseSWR.mockReturnValue({
      data: mockNavigations,
      error: undefined,
      isLoading: false,
      isValidating: false,
      mutate: jest.fn(),
    } as any);

    render(<NavigationList />);
    
    await waitFor(() => {
      expect(screen.getByTestId('navigation-updated-1')).toBeInTheDocument();
    });

    // Check that date is displayed (format may vary)
    const dateElements = screen.getAllByText(/Updated:/i);
    expect(dateElements.length).toBeGreaterThan(0);
  });

  it('renders correct number of navigation items', async () => {
    mockUseSWR.mockReturnValue({
      data: mockNavigations,
      error: undefined,
      isLoading: false,
      isValidating: false,
      mutate: jest.fn(),
    } as any);

    render(<NavigationList />);
    
    await waitFor(() => {
      // Count by title test IDs instead of card IDs
      const titles = screen.getAllByTestId(/navigation-title-/);
      expect(titles).toHaveLength(2);
    });
  });
});