import client from './client';

interface NotificationPrefs {
  emailNotifications: boolean;
  telegramNotifications: boolean;
  telegramPhone?: string;
}

export const authApi = {
  signup: (email: string, password: string, displayName?: string, notifications?: NotificationPrefs) =>
    client.post('/api/auth/signup', {
      email,
      password,
      displayName,
      emailNotifications: notifications?.emailNotifications ?? true,
      telegramNotifications: notifications?.telegramNotifications ?? false,
      telegramPhone: notifications?.telegramPhone,
    }),

  login: (email: string, password: string) =>
    client.post('/api/auth/login', { email, password }),

  refresh: (refreshToken: string) =>
    client.post('/api/auth/refresh', { refreshToken }),

  logout: (accessToken: string) =>
    client.post('/api/auth/logout', { accessToken }),
};

