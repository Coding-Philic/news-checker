import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class AuthService {
  private readonly supabase: SupabaseClient;
  private readonly supabaseAdmin: SupabaseClient;
  private readonly logger = new Logger(AuthService.name);

  constructor(private readonly configService: ConfigService) {
    this.supabase = createClient(
      this.configService.get<string>('supabase.url')!,
      this.configService.get<string>('supabase.anonKey')!,
    );

    this.supabaseAdmin = createClient(
      this.configService.get<string>('supabase.url')!,
      this.configService.get<string>('supabase.serviceRoleKey')!,
    );

    console.log('INIT AUTH SERVICE WITH SUPABASE URL:', this.configService.get<string>('supabase.url'));
  }

  async signup(
    email: string,
    password: string,
    displayName?: string,
    notifications?: {
      emailNotifications?: boolean;
      telegramNotifications?: boolean;
    },
  ) {
    const { data, error } = await this.supabase.auth.signUp({
      email,
      password,
      options: {
        data: { display_name: displayName },
      },
    });

    if (error) {
      this.logger.error(`Signup failed: ${error.message}`);
      throw new UnauthorizedException(error.message);
    }

    if (data.user) {
      await this.supabaseAdmin.from('user_profiles').upsert({
        id: data.user.id,
        email: email,
        display_name: displayName || email.split('@')[0],
        timezone: 'Asia/Kolkata',
        email_notifications: notifications?.emailNotifications ?? true,
        telegram_notifications: notifications?.telegramNotifications ?? false,
        schedule_time: '08:00:00',
      });
    }

    return {
      user: data.user,
      session: data.session,
    };
  }

  async login(email: string, password: string) {
    const { data, error } = await this.supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      this.logger.error(`Login failed: ${error.message}`);
      throw new UnauthorizedException('Invalid email or password');
    }

    return {
      user: data.user,
      session: data.session,
    };
  }

  async refreshToken(refreshToken: string) {
    const { data, error } = await this.supabase.auth.refreshSession({
      refresh_token: refreshToken,
    });

    if (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    return {
      session: data.session,
    };
  }

  async logout(accessToken: string) {
    const { error } = await this.supabase.auth.admin.signOut(accessToken);
    if (error) {
      this.logger.warn(`Logout warning: ${error.message}`);
    }
    return { message: 'Logged out successfully' };
  }

  async verifyToken(token: string) {
    const { data, error } = await this.supabase.auth.getUser(token);

    if (error || !data.user) {
      throw new UnauthorizedException('Invalid or expired token');
    }

    return data.user;
  }

  getAdminClient(): SupabaseClient {
    return this.supabaseAdmin;
  }
}
