import { Injectable, Logger } from '@nestjs/common';
import { BaseSearchAgent } from './base-search.agent';
import { NewsItem } from '../../common/types';

@Injectable()
export class DuckDuckGoAgent extends BaseSearchAgent {
  readonly name = 'duckduckgo';
  readonly platform = 'DuckDuckGo';
  private readonly logger = new Logger(DuckDuckGoAgent.name);

  async search(keywords: string[], categories: string[]): Promise<NewsItem[]> {
    const allItems: NewsItem[] = [];

    try {
      const searchTerms = [
        ...keywords.slice(0, 3),
        ...categories.slice(0, 2).map((c) => `${c} news today`),
      ];

      for (const term of searchTerms) {
        try {
          // Use DuckDuckGo instant answer API (free, no key)
          const url = `https://api.duckduckgo.com/?q=${encodeURIComponent(term)}&format=json&no_html=1&skip_disambig=1`;
          const response = await fetch(url);
          const data = await response.json();

          // Process abstract
          if (data.Abstract && data.AbstractURL) {
            allItems.push({
              title: this.cleanText(data.Heading || term),
              summary: this.truncate(this.cleanText(data.Abstract), 400),
              sourcePlatform: this.platform,
              sourceName: data.AbstractSource || 'DuckDuckGo',
              sourceUrl: data.AbstractURL,
              categorySlug: categories[0] || 'general',
              publishedAt: new Date().toISOString(),
              contentHash: this.createHash(`ddg-abs-${data.AbstractURL}`),
            });
          }

          // Process related topics
          if (data.RelatedTopics && Array.isArray(data.RelatedTopics)) {
            for (const topic of data.RelatedTopics.slice(0, 3)) {
              if (topic.Text && topic.FirstURL) {
                allItems.push({
                  title: this.cleanText(topic.Text.split(' - ')[0] || topic.Text.substring(0, 80)),
                  summary: this.truncate(this.cleanText(topic.Text), 300),
                  sourcePlatform: this.platform,
                  sourceName: 'DuckDuckGo',
                  sourceUrl: topic.FirstURL,
                  categorySlug: categories[0] || 'general',
                  publishedAt: new Date().toISOString(),
                  contentHash: this.createHash(`ddg-rt-${topic.FirstURL}`),
                });
              }
            }
          }
        } catch (err) {
          this.logger.warn(`Failed DDG search for "${term}": ${err}`);
        }
      }

      this.logger.log(`DuckDuckGo: fetched ${allItems.length} items`);
    } catch (error) {
      this.logger.error(`DuckDuckGo agent error: ${error}`);
    }

    return allItems;
  }
}
