import { Injectable, Logger } from '@nestjs/common';
import { BaseSearchAgent } from './base-search.agent';
import { NewsItem } from '../../common/types';

@Injectable()
export class HackerNewsAgent extends BaseSearchAgent {
  readonly name = 'hackernews';
  readonly platform = 'Hacker News';
  private readonly logger = new Logger(HackerNewsAgent.name);
  private readonly algoliaUrl = 'https://hn.algolia.com/api/v1';

  async search(keywords: string[], _categories: string[]): Promise<NewsItem[]> {
    const allItems: NewsItem[] = [];

    try {
      // Fetch front page top stories
      try {
        const frontPageUrl = `${this.algoliaUrl}/search?tags=front_page&hitsPerPage=15`;
        const response = await fetch(frontPageUrl);
        const data = await response.json();

        if (data.hits) {
          for (const hit of data.hits) {
            allItems.push({
              title: this.cleanText(hit.title || ''),
              summary: this.truncate(this.cleanText(hit.story_text || hit.title || ''), 300),
              sourcePlatform: this.platform,
              sourceName: 'Hacker News',
              sourceUrl: hit.url || `https://news.ycombinator.com/item?id=${hit.objectID}`,
              categorySlug: 'technology',
              publishedAt: hit.created_at || new Date().toISOString(),
              contentHash: this.createHash(`hn-${hit.objectID}`),
            });
          }
        }
      } catch (err) {
        this.logger.warn(`Failed to fetch HN front page: ${err}`);
      }

      // Search by keywords
      for (const keyword of keywords.slice(0, 3)) {
        try {
          const searchUrl = `${this.algoliaUrl}/search?query=${encodeURIComponent(keyword)}&tags=story&hitsPerPage=5`;
          const response = await fetch(searchUrl);
          const data = await response.json();

          if (data.hits) {
            for (const hit of data.hits) {
              allItems.push({
                title: this.cleanText(hit.title || ''),
                summary: this.truncate(this.cleanText(hit.story_text || hit.title || ''), 300),
                sourcePlatform: this.platform,
                sourceName: 'Hacker News',
                sourceUrl: hit.url || `https://news.ycombinator.com/item?id=${hit.objectID}`,
                categorySlug: 'technology',
                publishedAt: hit.created_at || new Date().toISOString(),
                contentHash: this.createHash(`hn-${hit.objectID}`),
              });
            }
          }
        } catch (err) {
          this.logger.warn(`Failed HN search for "${keyword}": ${err}`);
        }
      }

      this.logger.log(`Hacker News: fetched ${allItems.length} items`);
    } catch (error) {
      this.logger.error(`Hacker News agent error: ${error}`);
    }

    return allItems;
  }
}
