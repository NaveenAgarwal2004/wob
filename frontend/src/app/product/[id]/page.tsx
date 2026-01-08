'use client';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import useSWR from 'swr';
import { fetcher, productAPI } from '@/lib/api';
import { ProductWithDetails } from '@/lib/types';
import { useBrowsingHistory } from '@/lib/store';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, Star, RefreshCw, Loader2 } from 'lucide-react';

export default function ProductDetailPage() {
  const params = useParams();
  const addToHistory = useBrowsingHistory((state) => state.addToHistory);
  const { data: product, error, isLoading, mutate } = useSWR<ProductWithDetails>(
    `/products/${params.id}`,
    fetcher
  );
  const [refreshing, setRefreshing] = useState(false);

  // Track view when product loads
  useEffect(() => {
    if (product) {
      addToHistory(`/product/${params.id}`, product.title);
    }
  }, [product, params.id, addToHistory]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await productAPI.scrape(params.id as string);
      setTimeout(() => mutate(), 3000);
    } catch (error) {
      console.error('Failed to refresh:', error);
    } finally {
      setRefreshing(false);
    }
  };

  if (error) {
    return (
      <main className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <p className="text-red-600">Failed to load product details.</p>
          </div>
        </div>
      </main>
    );
  }

  if (isLoading) {
    return (
      <main className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex items-center justify-center min-h-[400px]">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Breadcrumb */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2 text-sm">
            <Link href="/" className="text-blue-600 hover:text-blue-700 transition">
              Home
            </Link>
            <span className="text-gray-400">/</span>
            {product?.category && (
              <>
                <Link 
                  href={`/products/${product.category.id}`}
                  className="text-blue-600 hover:text-blue-700 transition"
                >
                  {product.category.title}
                </Link>
                <span className="text-gray-400">/</span>
              </>
            )}
            <span className="text-gray-600">Product Details</span>
          </div>

          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing...' : 'Refresh Data'}
          </button>
        </div>

        {/* Product Detail */}
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-8">
            {/* Image */}
            <div className="aspect-[3/4] relative bg-gray-100 rounded-lg overflow-hidden">
              {product?.imageUrl ? (
                <Image
                  src={product.imageUrl}
                  alt={product.title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  No Image Available
                </div>
              )}
            </div>

            {/* Details */}
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{product?.title}</h1>
              {product?.author && (
                <p className="text-xl text-gray-600 mb-4">by {product.author}</p>
              )}
              {product?.price && (
                <p className="text-3xl font-bold text-green-600 mb-6">
                  £{product.price.toFixed(2)}
                </p>
              )}

              {/* Rating */}
              {product?.detail?.ratingsAvg && (
                <div className="flex items-center gap-2 mb-6">
                  <div className="flex items-center gap-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`h-5 w-5 ${
                          i < Math.round(product.detail!.ratingsAvg!)
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-lg font-semibold">{product.detail.ratingsAvg.toFixed(1)}</span>
                  <span className="text-gray-600">({product.detail.reviewsCount} reviews)</span>
                </div>
              )}

              {/* Description */}
              {product?.detail?.description && (
                <div className="mb-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">Description</h2>
                  <p className="text-gray-700 leading-relaxed">{product.detail.description}</p>
                </div>
              )}

              {/* Specs */}
              {product?.detail?.specs && Object.keys(product.detail.specs).length > 0 && (
                <div className="mb-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-3">Specifications</h2>
                  <dl className="grid grid-cols-1 gap-2">
                    {Object.entries(product.detail.specs).map(([key, value]) => (
                      <div key={key} className="flex py-2 border-b">
                        <dt className="font-medium text-gray-700 w-1/3">{key}:</dt>
                        <dd className="text-gray-600 w-2/3">{value}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              )}
            </div>
          </div>

          {/* Reviews */}
          {product?.reviews && product.reviews.length > 0 && (
            <div className="border-t p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Customer Reviews</h2>
              <div className="space-y-6">
                {product.reviews.map((review) => (
                  <div key={review.id} className="border-b pb-6 last:border-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-semibold text-gray-900">
                        {review.author || 'Anonymous'}
                      </span>
                      <div className="flex items-center gap-1">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`h-4 w-4 ${
                              i < review.rating
                                ? 'fill-yellow-400 text-yellow-400'
                                : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                    {review.text && <p className="text-gray-700">{review.text}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
