import { Injectable, Logger } from '@nestjs/common';
import Parser from 'rss-parser';
import { BaseSearchAgent } from './base-search.agent';
import { NewsItem } from '../../common/types';

const TOPIC_MAP: Record<string, string> = {
  technology: 'TECHNOLOGY',
  geopolitics: 'WORLD',
  business: 'BUSINESS',
  science: 'SCIENCE_AND_TECHNOLOGY',
  health: 'HEALTH',
  sports: 'SPORTS',
  entertainment: 'ENTERTAINMENT',
  environment: 'SCIENCE_AND_TECHNOLOGY',
  education: 'EDUCATION',
  general: 'TOP_STORIES',
};

@Injectable()
export class GoogleNewsAgent extends BaseSearchAgent {
  readonly name = 'google-news';
  readonly platform = 'Google News';
  private readonly parser = new Parser();
  private readonly logger = new Logger(GoogleNewsAgent.name);
  private readonly baseUrl = 'https://news.google.com/rss';

  async search(keywords: string[], categories: string[]): Promise<NewsItem[]> {
    const allItems: NewsItem[] = [];

    try {
      // Search by category topics
      for (const category of categories) {
        const topic = TOPIC_MAP[category] || 'TOP_STORIES';
        const url = `${this.baseUrl}/headlines/section/topic/${topic}?hl=en&gl=US&ceid=US:en`;

        try {
          const feed = await this.parser.parseURL(url);
          const items = (feed.items || []).slice(0, 10).map((item) => ({
            title: this.cleanText(item.title || ''),
            summary: this.cleanText(item.contentSnippet || item.content || ''),
            originalTitle: item.title || '',
            sourcePlatform: this.platform,
            sourceName: item.creator || 'Google News',
            sourceUrl: item.link || '',
            categorySlug: category,
            publishedAt: item.pubDate || new Date().toISOString(),
            contentHash: this.createHash(`gn-${item.link || item.title}`),
          }));
          allItems.push(...items);
        } catch (err) {
          this.logger.warn(`Failed to fetch Google News topic ${topic}: ${err}`);
        }
      }

      // Search by keywords
      for (const keyword of keywords.slice(0, 3)) {
        const url = `${this.baseUrl}/search?q=${encodeURIComponent(keyword)}&hl=en&gl=US&ceid=US:en`;

        try {
          const feed = await this.parser.parseURL(url);
          const items = (feed.items || []).slice(0, 5).map((item) => ({
            title: this.cleanText(item.title || ''),
            summary: this.cleanText(item.contentSnippet || item.content || ''),
            originalTitle: item.title || '',
            sourcePlatform: this.platform,
            sourceName: item.creator || 'Google News',
            sourceUrl: item.link || '',
            categorySlug: 'general',
            publishedAt: item.pubDate || new Date().toISOString(),
            contentHash: this.createHash(`gn-kw-${item.link || item.title}`),
          }));
          allItems.push(...items);
        } catch (err) {
          this.logger.warn(`Failed to search Google News for "${keyword}": ${err}`);
        }
      }

      this.logger.log(`Google News: fetched ${allItems.length} items`);
    } catch (error) {
      this.logger.error(`Google News agent error: ${error}`);
    }

    return allItems;
  }
}
