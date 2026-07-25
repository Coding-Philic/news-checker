import client from './client';

export const userApi = {
  getProfile: () => client.get('/api/users/profile'),

  updateProfile: (data: {
    displayName?: string;
    timezone?: string;
    telegramChatId?: string;
    emailNotifications?: boolean;
    telegramNotifications?: boolean;
    scheduleTime?: string;
  }) => client.put('/api/users/profile', data),

  getInterests: () => client.get('/api/users/interests'),

  updateInterests: (categories: string[]) =>
    client.put('/api/users/interests', { categories }),

  triggerWelcome: () =>
    client.post('/api/news/trigger-welcome'),

  getCategories: () => client.get('/api/categories'),
};
