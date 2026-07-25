import client from './client';

export const newsApi = {
  getFeed: (params?: { page?: number; limit?: number; category?: string; source?: string }) =>
    client.get('/api/news/feed', { params }),

  getPublicFeed: (params?: { page?: number; limit?: number; category?: string }) =>
    client.get('/api/news/public', { params }),

  triggerSearch: () =>
    client.post('/api/news/trigger'),

  getRunStatus: (runId: string) =>
    client.get(`/api/news/status/${runId}`),

  markAsRead: (feedItemId: string) =>
    client.post(`/api/news/read/${feedItemId}`),

  getArticle: (id: string) =>
    client.get(`/api/news/article/${id}`),
};
