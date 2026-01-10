'use client';
import Link from 'next/link';
import Image from 'next/image';
import { Product } from '@/lib/types';

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  return (
    <Link
      href={`/product/${product.id}`}
      className="group border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-all duration-200 bg-white"
      data-testid={`product-card-${product.id}`}
    >
      <div className="aspect-[3/4] relative bg-gray-100">
        {product.imageUrl ? (
          <Image
            src={product.imageUrl}
            alt={product.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-200"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            data-testid={`product-image-${product.id}`}
          />
        ) : (
          <div 
            className="w-full h-full flex items-center justify-center text-gray-400"
            data-testid={`product-no-image-${product.id}`}
          >
            No Image
          </div>
        )}
      </div>
      <div className="p-4">
        <h3 
          className="font-semibold text-gray-900 group-hover:text-blue-600 transition line-clamp-2 mb-1"
          data-testid={`product-title-${product.id}`}
        >
          {product.title}
        </h3>
        {product.author && (
          <p 
            className="text-sm text-gray-600 mb-2 line-clamp-1"
            data-testid={`product-author-${product.id}`}
          >
            by {product.author}
          </p>
        )}
        {product.price !== null && product.price !== undefined && (
          <p 
            className="text-lg font-bold text-green-600"
            data-testid={`product-price-${product.id}`}
          >
            £{Number(product.price).toFixed(2)}
          </p>
        )}
      </div>
    </Link>
  );
}
