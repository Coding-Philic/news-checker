import { Injectable, Logger } from '@nestjs/common';
import { BaseSearchAgent } from './base-search.agent';
import { NewsItem } from '../../common/types';

const TAG_MAP: Record<string, string[]> = {
  technology: ['javascript', 'python', 'webdev', 'devops', 'ai'],
  science: ['datascience', 'machinelearning', 'physics'],
  business: ['startup', 'saas', 'career'],
  education: ['tutorial', 'beginners', 'learning'],
  general: ['news', 'discuss', 'productivity'],
};

@Injectable()
export class DevToAgent extends BaseSearchAgent {
  readonly name = 'devto';
  readonly platform = 'DEV.to';
  private readonly logger = new Logger(DevToAgent.name);
  private readonly baseUrl = 'https://dev.to/api';

  async search(_keywords: string[], categories: string[]): Promise<NewsItem[]> {
    const allItems: NewsItem[] = [];

    try {
      // Fetch top articles of the day
      try {
        const topUrl = `${this.baseUrl}/articles?top=1&per_page=10`;
        const response = await fetch(topUrl, {
          headers: { 'User-Agent': 'NewsCheckerBot/1.0' },
        });
        const articles = await response.json();

        if (Array.isArray(articles)) {
          for (const article of articles) {
            allItems.push({
              title: this.cleanText(article.title || ''),
              summary: this.truncate(this.cleanText(article.description || ''), 300),
              sourcePlatform: this.platform,
              sourceName: article.user?.name || 'DEV.to',
              sourceUrl: article.url || '',
              categorySlug: 'technology',
              publishedAt: article.published_at || new Date().toISOString(),
              contentHash: this.createHash(`devto-${article.id}`),
            });
          }
        }
      } catch (err) {
        this.logger.warn(`Failed to fetch DEV.to top articles: ${err}`);
      }

      // Fetch by relevant tags
      for (const category of categories.slice(0, 2)) {
        const tags = TAG_MAP[category] || TAG_MAP['general'];

        for (const tag of tags.slice(0, 2)) {
          try {
            const tagUrl = `${this.baseUrl}/articles?tag=${tag}&top=1&per_page=5`;
            const response = await fetch(tagUrl, {
              headers: { 'User-Agent': 'NewsCheckerBot/1.0' },
            });
            const articles = await response.json();

            if (Array.isArray(articles)) {
              for (const article of articles) {
                allItems.push({
                  title: this.cleanText(article.title || ''),
                  summary: this.truncate(this.cleanText(article.description || ''), 300),
                  sourcePlatform: this.platform,
                  sourceName: article.user?.name || 'DEV.to',
                  sourceUrl: article.url || '',
                  categorySlug: category,
                  publishedAt: article.published_at || new Date().toISOString(),
                  contentHash: this.createHash(`devto-${article.id}`),
                });
              }
            }
          } catch (err) {
            this.logger.warn(`Failed DEV.to fetch for tag "${tag}": ${err}`);
          }
        }
      }

      this.logger.log(`DEV.to: fetched ${allItems.length} items`);
    } catch (error) {
      this.logger.error(`DEV.to agent error: ${error}`);
    }

    return allItems;
  }
}
