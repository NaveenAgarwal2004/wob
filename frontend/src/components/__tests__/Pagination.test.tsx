import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import Pagination from '../Pagination';

describe('Pagination', () => {
  const mockOnPageChange = jest.fn();

  beforeEach(() => {
    mockOnPageChange.mockClear();
  });

  it('does not render when totalPages is 1', () => {
    const { container } = render(
      <Pagination currentPage={1} totalPages={1} onPageChange={mockOnPageChange} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders page numbers correctly', () => {
    render(<Pagination currentPage={1} totalPages={5} onPageChange={mockOnPageChange} />);
    
    expect(screen.getByTestId('pagination')).toBeInTheDocument();
    expect(screen.getByTestId('pagination-page-1')).toBeInTheDocument();
  });

  it('calls onPageChange when page button is clicked', () => {
    render(<Pagination currentPage={1} totalPages={5} onPageChange={mockOnPageChange} />);
    
    const page2Button = screen.getByTestId('pagination-page-2');
    fireEvent.click(page2Button);
    
    expect(mockOnPageChange).toHaveBeenCalledWith(2);
  });

  it('disables previous button on first page', () => {
    render(<Pagination currentPage={1} totalPages={5} onPageChange={mockOnPageChange} />);
    
    const prevButton = screen.getByTestId('pagination-prev');
    expect(prevButton).toBeDisabled();
  });

  it('disables next button on last page', () => {
    render(<Pagination currentPage={5} totalPages={5} onPageChange={mockOnPageChange} />);
    
    const nextButton = screen.getByTestId('pagination-next');
    expect(nextButton).toBeDisabled();
  });

  it('enables both buttons on middle pages', () => {
    render(<Pagination currentPage={3} totalPages={5} onPageChange={mockOnPageChange} />);
    
    const prevButton = screen.getByTestId('pagination-prev');
    const nextButton = screen.getByTestId('pagination-next');
    
    expect(prevButton).not.toBeDisabled();
    expect(nextButton).not.toBeDisabled();
  });

  it('highlights current page', () => {
    render(<Pagination currentPage={3} totalPages={5} onPageChange={mockOnPageChange} />);
    
    const currentPageButton = screen.getByTestId('pagination-page-3');
    expect(currentPageButton).toHaveClass('bg-blue-600');
  });

  it('shows ellipsis for large page ranges', () => {
    render(<Pagination currentPage={1} totalPages={10} onPageChange={mockOnPageChange} />);
    
    expect(screen.getByText('...')).toBeInTheDocument();
  });
});
