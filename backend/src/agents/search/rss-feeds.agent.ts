import { Injectable, Logger } from '@nestjs/common';
import Parser from 'rss-parser';
import { BaseSearchAgent } from './base-search.agent';
import { NewsItem } from '../../common/types';

const RSS_SOURCES: Record<string, { name: string; url: string }[]> = {
  technology: [
    { name: 'Ars Technica', url: 'https://feeds.arstechnica.com/arstechnica/index' },
    { name: 'TechCrunch', url: 'https://techcrunch.com/feed/' },
    { name: 'The Verge', url: 'https://www.theverge.com/rss/index.xml' },
  ],
  geopolitics: [
    { name: 'BBC World', url: 'https://feeds.bbci.co.uk/news/world/rss.xml' },
    { name: 'Reuters World', url: 'https://feeds.reuters.com/reuters/worldNews' },
    { name: 'Al Jazeera', url: 'https://www.aljazeera.com/xml/rss/all.xml' },
  ],
  business: [
    { name: 'BBC Business', url: 'https://feeds.bbci.co.uk/news/business/rss.xml' },
    { name: 'CNBC', url: 'https://search.cnbc.com/rs/search/combinedcms/view.xml?partnerId=wrss01&id=10001147' },
  ],
  science: [
    { name: 'ScienceDaily', url: 'https://www.sciencedaily.com/rss/all.xml' },
    { name: 'NASA', url: 'https://www.nasa.gov/rss/dyn/breaking_news.rss' },
  ],
  health: [
    { name: 'BBC Health', url: 'https://feeds.bbci.co.uk/news/health/rss.xml' },
    { name: 'Medical News Today', url: 'https://www.medicalnewstoday.com/newsfeeds/rss' },
  ],
  sports: [
    { name: 'ESPN', url: 'https://www.espn.com/espn/rss/news' },
    { name: 'BBC Sport', url: 'https://feeds.bbci.co.uk/sport/rss.xml' },
  ],
  entertainment: [
    { name: 'BBC Entertainment', url: 'https://feeds.bbci.co.uk/news/entertainment_and_arts/rss.xml' },
  ],
  environment: [
    { name: 'BBC Science/Environment', url: 'https://feeds.bbci.co.uk/news/science_and_environment/rss.xml' },
  ],
  education: [
    { name: 'BBC Education', url: 'https://feeds.bbci.co.uk/news/education/rss.xml' },
  ],
  general: [
    { name: 'NPR News', url: 'https://feeds.npr.org/1001/rss.xml' },
    { name: 'AP News', url: 'https://rsshub.app/apnews/topics/apf-topnews' },
    { name: 'The Guardian', url: 'https://www.theguardian.com/world/rss' },
  ],
};

@Injectable()
export class RssFeedsAgent extends BaseSearchAgent {
  readonly name = 'rss-feeds';
  readonly platform = 'RSS Feeds';
  private readonly parser = new Parser({ timeout: 10000 });
  private readonly logger = new Logger(RssFeedsAgent.name);

  async search(_keywords: string[], categories: string[]): Promise<NewsItem[]> {
    const allItems: NewsItem[] = [];

    try {
      for (const category of categories) {
        const sources = RSS_SOURCES[category] || RSS_SOURCES['general'];

        for (const source of sources) {
          try {
            const feed = await this.parser.parseURL(source.url);
            const items = (feed.items || []).slice(0, 5).map((item) => ({
              title: this.cleanText(item.title || ''),
              summary: this.truncate(
                this.cleanText(item.contentSnippet || item.content || item.title || ''),
                400,
              ),
              originalTitle: item.title || '',
              sourcePlatform: this.platform,
              sourceName: source.name,
              sourceUrl: item.link || '',
              categorySlug: category,
              publishedAt: item.pubDate || item.isoDate || new Date().toISOString(),
              contentHash: this.createHash(`rss-${source.name}-${item.link}`),
            }));
            allItems.push(...items);
          } catch (err) {
            this.logger.warn(`Failed RSS fetch from ${source.name}: ${err}`);
          }
        }
      }

      this.logger.log(`RSS Feeds: fetched ${allItems.length} items`);
    } catch (error) {
      this.logger.error(`RSS Feeds agent error: ${error}`);
    }

    return allItems;
  }
}
