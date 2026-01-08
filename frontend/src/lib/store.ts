import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { api } from './api';

interface HistoryItem {
  path: string;
  title: string;
  timestamp: number;
}

interface BrowsingHistoryStore {
  history: HistoryItem[];
  sessionId: string;
  addToHistory: (path: string, title: string) => Promise<void>;
  clearHistory: () => void;
  loadHistory: () => Promise<void>;
}

// Generate or retrieve session ID
const getSessionId = () => {
  if (typeof window === 'undefined') return '';
  let sessionId = localStorage.getItem('session_id');
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('session_id', sessionId);
  }
  return sessionId;
};

export const useBrowsingHistory = create<BrowsingHistoryStore>()()
  persist(
    (set, get) => ({
      history: [],
      sessionId: getSessionId(),
      
      addToHistory: async (path, title) => {
        const { sessionId, history } = get();
        const newItem = { path, title, timestamp: Date.now() };
        
        // Update local state
        set({
          history: [
            newItem,
            ...history.filter((item) => item.path !== path).slice(0, 49),
          ],
        });

        // Persist to backend
        try {
          await api.post('/view-history/track', {
            sessionId,
            pathJson: {
              path,
              title,
              timestamp: Date.now(),
            },
          });
        } catch (error) {
          console.error('Failed to track view:', error);
        }
      },
      
      clearHistory: () => set({ history: [] }),
      
      // Load history from backend on app start
      loadHistory: async () => {
        const { sessionId } = get();
        try {
          const response = await api.get(`/view-history?sessionId=${sessionId}&limit=50`);
          const backendHistory = response.data.map((item: any) => ({
            path: item.pathJson.path,
            title: item.pathJson.title,
            timestamp: new Date(item.createdAt).getTime(),
          }));
          set({ history: backendHistory });
        } catch (error) {
          console.error('Failed to load history:', error);
        }
      },
    }),
    {
      name: 'browsing-history',
    }
  )
);
