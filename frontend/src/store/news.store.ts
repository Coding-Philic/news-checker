import { create } from 'zustand';

interface NewsItem {
  id: string;
  feedId?: string;
  title: string;
  summary: string;
  source_platform: string;
  source_name: string;
  source_url: string;
  relevance_score: number;
  published_at: string;
  fetched_at: string;
  is_read?: boolean;
  categories?: { id: number; name: string; slug: string };
}

interface NewsState {
  items: NewsItem[];
  total: number;
  page: number;
  limit: number;
  isLoading: boolean;
  activeCategory: string | null;
  searchTriggered: boolean;
  setItems: (items: NewsItem[], total: number) => void;
  setPage: (page: number) => void;
  setLoading: (loading: boolean) => void;
  setActiveCategory: (category: string | null) => void;
  setSearchTriggered: (triggered: boolean) => void;
  markRead: (feedItemId: string) => void;
}

export const useNewsStore = create<NewsState>((set) => ({
  items: [],
  total: 0,
  page: 1,
  limit: 20,
  isLoading: false,
  activeCategory: null,
  searchTriggered: false,

  setItems: (items, total) => set({ items, total }),
  setPage: (page) => set({ page }),
  setLoading: (isLoading) => set({ isLoading }),
  setActiveCategory: (activeCategory) => set({ activeCategory, page: 1 }),
  setSearchTriggered: (searchTriggered) => set({ searchTriggered }),
  markRead: (feedItemId) =>
    set((state) => ({
      items: state.items.map((item) =>
        item.feedId === feedItemId ? { ...item, is_read: true } : item,
      ),
    })),
}));
