import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Category } from '../common/types';

const DEFAULT_CATEGORIES: Omit<Category, 'id'>[] = [
  { name: 'Technology', slug: 'technology', description: 'Tech news, AI, software, hardware, startups' },
  { name: 'Geopolitics', slug: 'geopolitics', description: 'International relations, politics, global affairs' },
  { name: 'Business & Finance', slug: 'business', description: 'Markets, economy, companies, entrepreneurship' },
  { name: 'Science', slug: 'science', description: 'Research, discoveries, space, physics, biology' },
  { name: 'Health', slug: 'health', description: 'Medical news, wellness, public health' },
  { name: 'Sports', slug: 'sports', description: 'Sports news, scores, athletes, events' },
  { name: 'Entertainment', slug: 'entertainment', description: 'Movies, music, TV, celebrities, culture' },
  { name: 'Environment', slug: 'environment', description: 'Climate change, sustainability, nature' },
  { name: 'Education', slug: 'education', description: 'Education policy, universities, online learning' },
  { name: 'General', slug: 'general', description: 'Trending news, world events, miscellaneous' },
];

@Injectable()
export class CategoriesService implements OnModuleInit {
  private readonly supabase: SupabaseClient;
  private readonly logger = new Logger(CategoriesService.name);

  constructor(private readonly configService: ConfigService) {
    this.supabase = createClient(
      this.configService.get<string>('supabase.url')!,
      this.configService.get<string>('supabase.serviceRoleKey')!,
    );
  }

  async onModuleInit() {
    await this.seedCategories();
  }

  private async seedCategories() {
    const { data: existing } = await this.supabase
      .from('categories')
      .select('slug');

    const existingSlugs = new Set((existing || []).map((c: { slug: string }) => c.slug));

    const toInsert = DEFAULT_CATEGORIES.filter((c) => !existingSlugs.has(c.slug));

    if (toInsert.length > 0) {
      const { error } = await this.supabase.from('categories').insert(toInsert);
      if (error) {
        this.logger.warn(`Category seed warning: ${error.message}`);
      } else {
        this.logger.log(`Seeded ${toInsert.length} categories`);
      }
    }
  }

  async getAll(): Promise<Category[]> {
    const { data, error } = await this.supabase
      .from('categories')
      .select('*')
      .order('id', { ascending: true });

    if (error) {
      this.logger.error(`Failed to get categories: ${error.message}`);
      return [];
    }

    return data || [];
  }

  async getBySlug(slug: string): Promise<Category | null> {
    const { data, error } = await this.supabase
      .from('categories')
      .select('*')
      .eq('slug', slug)
      .single();

    if (error) return null;
    return data;
  }

  async getIdBySlug(slug: string): Promise<number | null> {
    const category = await this.getBySlug(slug);
    return category?.id || null;
  }
}
