import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { RedisService } from '../cache/redis.service';
import { PaginationQuery } from '../common/types';

@Injectable()
export class NewsService {
  private readonly supabase: SupabaseClient;
  private readonly logger = new Logger(NewsService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly redisService: RedisService,
  ) {
    this.supabase = createClient(
      this.configService.get<string>('supabase.url')!,
      this.configService.get<string>('supabase.serviceRoleKey')!,
    );
  }

  async getUserFeed(userId: string, query: PaginationQuery) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const offset = (page - 1) * limit;

    // Check cache
    const cacheKey = `feed:user:${userId}:${page}:${limit}:${query.category || 'all'}:${query.source || 'all'}`;
    const cached = await this.redisService.get(cacheKey);
    if (cached) return cached;

    try {
      let dbQuery = this.supabase
        .from('user_news_feed')
        .select(
          `
          id,
          delivered_via,
          delivered_at,
          is_read,
          news_items (
            id,
            title,
            summary,
            source_platform,
            source_name,
            source_url,
            relevance_score,
            published_at,
            fetched_at,
            categories (
              id,
              name,
              slug
            )
          )
        `,
          { count: 'exact' },
        )
        .eq('user_id', userId)
        .order('delivered_at', { ascending: false })
        .range(offset, offset + limit - 1);

      // Apply category filter
      if (query.category) {
        dbQuery = dbQuery.eq('news_items.categories.slug', query.category);
      }

      // Apply source filter
      if (query.source) {
        dbQuery = dbQuery.eq('news_items.source_platform', query.source);
      }

      const { data, error, count } = await dbQuery;

      if (error) {
        this.logger.error(`Feed query error: ${error.message}`);
        return { items: [], total: 0, page, limit };
      }

      const result = {
        items: (data || [])
          .filter((item: Record<string, unknown>) => item.news_items)
          .map((item: Record<string, unknown>) => ({
            feedId: item.id,
            deliveredVia: item.delivered_via,
            deliveredAt: item.delivered_at,
            isRead: item.is_read,
            ...(item.news_items as Record<string, unknown>),
          })),
        total: count || 0,
        page,
        limit,
      };

      // Cache for 15 minutes
      await this.redisService.set(cacheKey, result, 900);

      return result;
    } catch (error) {
      this.logger.error(`Feed fetch error: ${error}`);
      return { items: [], total: 0, page, limit };
    }
  }

  async markAsRead(userId: string, feedItemId: string) {
    const { error } = await this.supabase
      .from('user_news_feed')
      .update({ is_read: true })
      .eq('id', feedItemId)
      .eq('user_id', userId);

    if (error) {
      this.logger.error(`Mark read error: ${error.message}`);
    }

    // Invalidate cache
    await this.redisService.invalidatePattern(`feed:user:${userId}:*`);

    return { success: !error };
  }

  async getPublicFeed(query: PaginationQuery) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const offset = (page - 1) * limit;

    const cacheKey = `news:public:${page}:${limit}:${query.category || 'all'}`;
    const cached = await this.redisService.get(cacheKey);
    if (cached) return cached;

    let dbQuery = this.supabase
      .from('news_items')
      .select(
        `
        id,
        title,
        summary,
        source_platform,
        source_name,
        source_url,
        relevance_score,
        published_at,
        fetched_at,
        categories (
          id,
          name,
          slug
        )
      `,
        { count: 'exact' },
      )
      .order('fetched_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (query.category) {
      dbQuery = dbQuery.eq('categories.slug', query.category);
    }

    const { data, error, count } = await dbQuery;

    if (error) {
      this.logger.error(`Public feed error: ${error.message}`);
      return { items: [], total: 0, page, limit };
    }

    const result = {
      items: data || [],
      total: count || 0,
      page,
      limit,
    };

    await this.redisService.set(cacheKey, result, 3600);
    return result;
  }

  async getArticleById(id: string) {
    const { data, error } = await this.supabase
      .from('news_items')
      .select(`
        id,
        title,
        summary,
        source_platform,
        source_name,
        source_url,
        relevance_score,
        published_at,
        fetched_at,
        categories (
          id,
          name,
          slug
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      this.logger.error(`Get article error: ${error.message}`);
      return null;
    }

    return data;
  }
}
