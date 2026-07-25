import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BaseSearchAgent } from './base-search.agent';
import { NewsItem } from '../../common/types';

const CATEGORY_MAP: Record<string, string> = {
  technology: 'technology',
  geopolitics: 'politics',
  business: 'business',
  science: 'science',
  health: 'health',
  sports: 'sports',
  entertainment: 'entertainment',
  environment: 'environment',
  education: 'education',
  general: 'top',
};

@Injectable()
export class NewsDataAgent extends BaseSearchAgent {
  readonly name = 'newsdata';
  readonly platform = 'NewsData.io';
  private readonly logger = new Logger(NewsDataAgent.name);
  private readonly apiKey: string;

  constructor(private readonly configService: ConfigService) {
    super();
    this.apiKey = this.configService.get<string>('newsdata.apiKey') || '';
  }

  async search(_keywords: string[], categories: string[]): Promise<NewsItem[]> {
    const allItems: NewsItem[] = [];

    if (!this.apiKey) {
      this.logger.warn('NewsData.io API key not configured, skipping');
      return allItems;
    }

    try {
      // Limit to 3 category requests to conserve the 200/day limit
      for (const category of categories.slice(0, 3)) {
        const apiCategory = CATEGORY_MAP[category] || 'top';
        const url = `https://newsdata.io/api/1/latest?apikey=${this.apiKey}&category=${apiCategory}&language=en&size=10`;

        try {
          const response = await fetch(url);
          const data = await response.json();

          if (data.status === 'success' && data.results) {
            for (const article of data.results) {
              allItems.push({
                title: this.cleanText(article.title || ''),
                summary: this.truncate(this.cleanText(article.description || article.content || ''), 400),
                originalTitle: article.title,
                sourcePlatform: this.platform,
                sourceName: article.source_name || article.source_id || 'NewsData',
                sourceUrl: article.link || '',
                categorySlug: category,
                publishedAt: article.pubDate || new Date().toISOString(),
                contentHash: this.createHash(`nd-${article.article_id || article.link}`),
              });
            }
          }
        } catch (err) {
          this.logger.warn(`Failed NewsData.io fetch for ${apiCategory}: ${err}`);
        }
      }

      this.logger.log(`NewsData.io: fetched ${allItems.length} items`);
    } catch (error) {
      this.logger.error(`NewsData agent error: ${error}`);
    }

    return allItems;
  }
}
