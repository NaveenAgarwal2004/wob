// frontend/src/components/__tests__/ProductCard.test.tsx
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import ProductCard from '../ProductCard';
import { Product } from '@/lib/types';

// Mock Next.js Image component
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) => {
    const { fill, ...rest } = props;
    // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
    return <img {...rest} />;
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

  it('has correct link structure', () => {
    render(<ProductCard product={mockProduct} />);
    
    // Check that the card is a link
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/product/test-id-1');
  });

  it('displays all product elements', () => {
    render(<ProductCard product={mockProduct} />);
    
    // Title should be present
    expect(screen.getByTestId('product-title-test-id-1')).toBeInTheDocument();
    
    // Author should be present
    expect(screen.getByTestId('product-author-test-id-1')).toBeInTheDocument();
    
    // Price should be present
    expect(screen.getByTestId('product-price-test-id-1')).toBeInTheDocument();
    
    // Image should be present
    expect(screen.getByTestId('product-image-test-id-1')).toBeInTheDocument();
  });
});