import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { UserProfile } from '../common/types';

@Injectable()
export class UsersService {
  private readonly supabase: SupabaseClient;
  private readonly logger = new Logger(UsersService.name);

  constructor(private readonly configService: ConfigService) {
    this.supabase = createClient(
      this.configService.get<string>('supabase.url')!,
      this.configService.get<string>('supabase.serviceRoleKey')!,
    );
  }

  async getProfile(userId: string): Promise<UserProfile | null> {
    const { data: profile, error } = await this.supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      this.logger.error(`Failed to get profile: ${error.message}`);
      return null;
    }

    const { data: interests } = await this.supabase
      .from('user_interests')
      .select('categories(slug)')
      .eq('user_id', userId);

    const interestSlugs = (interests || []).map(
      (i: any) => i.categories?.slug || '',
    ).filter(Boolean);

    return {
      id: profile.id,
      displayName: profile.display_name,
      email: profile.email || '',
      timezone: profile.timezone,
      telegramChatId: profile.telegram_chat_id,
      emailNotifications: profile.email_notifications,
      telegramNotifications: profile.telegram_notifications,
      scheduleTime: profile.schedule_time,
      interests: interestSlugs,
    };
  }

  async updateProfile(
    userId: string,
    updates: {
      displayName?: string;
      timezone?: string;
      telegramChatId?: string;
      emailNotifications?: boolean;
      telegramNotifications?: boolean;
      scheduleTime?: string;
    },
  ) {
    const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() };

    if (updates.displayName !== undefined) updateData.display_name = updates.displayName;
    if (updates.timezone !== undefined) updateData.timezone = updates.timezone;
    if (updates.telegramChatId !== undefined) updateData.telegram_chat_id = updates.telegramChatId;
    if (updates.emailNotifications !== undefined) updateData.email_notifications = updates.emailNotifications;
    if (updates.telegramNotifications !== undefined) updateData.telegram_notifications = updates.telegramNotifications;
    if (updates.scheduleTime !== undefined) updateData.schedule_time = updates.scheduleTime;

    const { error } = await this.supabase
      .from('user_profiles')
      .update(updateData)
      .eq('id', userId);

    if (error) {
      this.logger.error(`Failed to update profile: ${error.message}`);
      throw new Error('Failed to update profile');
    }

    return this.getProfile(userId);
  }

  async getInterests(userId: string): Promise<string[]> {
    const { data, error } = await this.supabase
      .from('user_interests')
      .select('categories(slug)')
      .eq('user_id', userId);

    if (error) {
      this.logger.error(`Failed to get interests: ${error.message}`);
      return [];
    }

    return (data || []).map(
      (i: any) => i.categories?.slug || '',
    ).filter(Boolean);
  }

  async updateInterests(userId: string, categorySlugs: string[]) {
    // Get category IDs from slugs
    const { data: categories } = await this.supabase
      .from('categories')
      .select('id, slug')
      .in('slug', categorySlugs);

    if (!categories || categories.length === 0) {
      return [];
    }

    // Delete existing interests
    await this.supabase
      .from('user_interests')
      .delete()
      .eq('user_id', userId);

    // Insert new interests
    const inserts = categories.map((cat: { id: number }) => ({
      user_id: userId,
      category_id: cat.id,
    }));

    const { error } = await this.supabase
      .from('user_interests')
      .insert(inserts);

    if (error) {
      this.logger.error(`Failed to update interests: ${error.message}`);
      throw new Error('Failed to update interests');
    }

    return categorySlugs;
  }

  async getAllUsersWithInterests(scheduleTime?: string): Promise<UserProfile[]> {
    let query = this.supabase.from('user_profiles').select('*');
    
    if (scheduleTime) {
      query = query.eq('schedule_time', scheduleTime);
    }

    const { data: profiles, error } = await query;

    if (error || !profiles) {
      this.logger.error(`Failed to get users: ${error?.message}`);
      return [];
    }

    const users: UserProfile[] = [];

    for (const profile of profiles) {
      const { data: interests } = await this.supabase
        .from('user_interests')
        .select('categories(slug)')
        .eq('user_id', profile.id);

      const interestSlugs = (interests || []).map(
        (i: any) => i.categories?.slug || '',
      ).filter(Boolean);

      if (interestSlugs.length > 0) {
        users.push({
          id: profile.id,
          displayName: profile.display_name,
          email: profile.email || '',
          timezone: profile.timezone,
          telegramChatId: profile.telegram_chat_id,
          emailNotifications: profile.email_notifications,
          telegramNotifications: profile.telegram_notifications,
          scheduleTime: profile.schedule_time,
          interests: interestSlugs,
        });
      }
    }

    return users;
  }
}
