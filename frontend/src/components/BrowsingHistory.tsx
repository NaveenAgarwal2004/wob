'use client';
import { useBrowsingHistory } from '@/lib/store';
import Link from 'next/link';
import { History, X } from 'lucide-react';
import { useState } from 'react';

export default function BrowsingHistory() {
  const { history, clearHistory } = useBrowsingHistory();
  const [isOpen, setIsOpen] = useState(false);

  if (history.length === 0) return null;

  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 bg-blue-600 text-white p-3 rounded-full shadow-lg hover:bg-blue-700 transition z-40"
        aria-label="Toggle browsing history"
        data-testid="history-toggle-btn"
      >
        <History className="h-6 w-6" />
      </button>

      {/* Sidebar */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={() => setIsOpen(false)}
            data-testid="history-backdrop"
          />

          {/* Sidebar Panel */}
          <div 
            className="fixed top-0 right-0 h-full w-80 bg-white shadow-2xl z-50 overflow-y-auto"
            data-testid="history-sidebar"
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Browsing History</h2>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 hover:bg-gray-100 rounded"
                  aria-label="Close history"
                  data-testid="history-close-btn"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {history.length > 0 && (
                <button
                  onClick={clearHistory}
                  className="w-full mb-4 px-4 py-2 text-sm bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition"
                  data-testid="history-clear-btn"
                >
                  Clear History
                </button>
              )}

              <div className="space-y-2">
                {history.map((item, index) => (
                  <Link
                    key={`${item.path}-${item.timestamp}`}
                    href={item.path}
                    onClick={() => setIsOpen(false)}
                    className="block p-3 bg-gray-50 rounded-lg hover:bg-blue-50 hover:border-blue-200 border border-transparent transition"
                    data-testid={`history-item-${index}`}
                  >
                    <p className="font-medium text-gray-900 text-sm line-clamp-2">
                      {item.title}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(item.timestamp).toLocaleString()}
                    </p>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
