import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import ProductCard from '../ProductCard';
import { Product } from '@/lib/types';

// Mock Next.js Image component
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) => {
    // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
    return <img {...props} />;
  },
}));

// Mock Next.js Link component
jest.mock('next/link', () => {
  return ({ children, href }: any) => {
    return <a href={href}>{children}</a>;
  };
});

describe('ProductCard', () => {
  const mockProduct: Product = {
    id: 'test-id-1',
    sourceId: 'book-123',
    title: 'Test Book Title',
    author: 'Test Author',
    price: 12.99,
    currency: 'GBP',
    imageUrl: 'https://example.com/book.jpg',
    sourceUrl: 'https://example.com/product/book-123',
    categoryId: 'cat-1',
    lastScrapedAt: new Date().toISOString(),
  };

  it('renders product information correctly', () => {
    render(<ProductCard product={mockProduct} />);
    
    expect(screen.getByText('Test Book Title')).toBeInTheDocument();
    expect(screen.getByText('by Test Author')).toBeInTheDocument();
    expect(screen.getByText('£12.99')).toBeInTheDocument();
  });

  it('renders without author when author is null', () => {
    const productWithoutAuthor = { ...mockProduct, author: null };
    render(<ProductCard product={productWithoutAuthor} />);
    
    expect(screen.getByText('Test Book Title')).toBeInTheDocument();
    expect(screen.queryByText(/by/)).not.toBeInTheDocument();
  });

  it('renders without price when price is null', () => {
    const productWithoutPrice = { ...mockProduct, price: null };
    render(<ProductCard product={productWithoutPrice} />);
    
    expect(screen.getByText('Test Book Title')).toBeInTheDocument();
    expect(screen.queryByText(/£/)).not.toBeInTheDocument();
  });

  it('shows "No Image" when imageUrl is null', () => {
    const productWithoutImage = { ...mockProduct, imageUrl: null };
    render(<ProductCard product={productWithoutImage} />);
    
    expect(screen.getByText('No Image')).toBeInTheDocument();
  });

  it('has correct test IDs', () => {
    render(<ProductCard product={mockProduct} />);
    
    expect(screen.getByTestId('product-card-test-id-1')).toBeInTheDocument();
    expect(screen.getByTestId('product-title-test-id-1')).toBeInTheDocument();
    expect(screen.getByTestId('product-author-test-id-1')).toBeInTheDocument();
    expect(screen.getByTestId('product-price-test-id-1')).toBeInTheDocument();
  });
});
