import { Injectable, Logger } from '@nestjs/common';
import { BaseSearchAgent } from './base-search.agent';
import { NewsItem } from '../../common/types';

@Injectable()
export class WikipediaAgent extends BaseSearchAgent {
  readonly name = 'wikipedia';
  readonly platform = 'Wikipedia';
  private readonly logger = new Logger(WikipediaAgent.name);
  private readonly baseUrl = 'https://en.wikipedia.org/w/api.php';

  async search(keywords: string[], _categories: string[]): Promise<NewsItem[]> {
    const allItems: NewsItem[] = [];

    try {
      // Fetch current events portal
      try {
        const currentEventsUrl = `${this.baseUrl}?action=parse&page=Portal:Current_events&prop=text&format=json&section=0`;
        const response = await fetch(currentEventsUrl, {
          headers: { 'User-Agent': 'NewsCheckerBot/1.0 (news-checker-app)' },
        });
        const data = await response.json();

        if (data.parse?.text?.['*']) {
          const html = data.parse.text['*'];
          const text = this.cleanText(html);
          if (text.length > 50) {
            allItems.push({
              title: 'Current Events Summary',
              summary: this.truncate(text, 400),
              sourcePlatform: this.platform,
              sourceName: 'Wikipedia Current Events',
              sourceUrl: 'https://en.wikipedia.org/wiki/Portal:Current_events',
              categorySlug: 'general',
              publishedAt: new Date().toISOString(),
              contentHash: this.createHash(`wiki-ce-${new Date().toDateString()}`),
            });
          }
        }
      } catch (err) {
        this.logger.warn(`Failed to fetch Wikipedia current events: ${err}`);
      }

      // Search by keywords
      for (const keyword of keywords.slice(0, 5)) {
        try {
          const searchUrl = `${this.baseUrl}?action=query&list=search&srsearch=${encodeURIComponent(keyword)}&srnamespace=0&srlimit=5&format=json`;
          const response = await fetch(searchUrl, {
            headers: { 'User-Agent': 'NewsCheckerBot/1.0 (news-checker-app)' },
          });
          const data = await response.json();

          if (data.query?.search) {
            for (const result of data.query.search) {
              allItems.push({
                title: this.cleanText(result.title),
                summary: this.truncate(this.cleanText(result.snippet), 300),
                sourcePlatform: this.platform,
                sourceName: 'Wikipedia',
                sourceUrl: `https://en.wikipedia.org/wiki/${encodeURIComponent(result.title.replace(/ /g, '_'))}`,
                categorySlug: 'general',
                publishedAt: result.timestamp || new Date().toISOString(),
                contentHash: this.createHash(`wiki-${result.pageid}`),
              });
            }
          }
        } catch (err) {
          this.logger.warn(`Failed Wikipedia search for "${keyword}": ${err}`);
        }
      }

      this.logger.log(`Wikipedia: fetched ${allItems.length} items`);
    } catch (error) {
      this.logger.error(`Wikipedia agent error: ${error}`);
    }

    return allItems;
  }
}
