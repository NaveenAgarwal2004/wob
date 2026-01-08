'use client';
import { useEffect } from 'react';
import { useBrowsingHistory } from '@/lib/store';

export default function HistoryLoader() {
  const loadHistory = useBrowsingHistory((state) => state.loadHistory);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  return null;
}
