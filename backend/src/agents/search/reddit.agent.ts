import { Injectable, Logger } from '@nestjs/common';
import Parser from 'rss-parser';
import { BaseSearchAgent } from './base-search.agent';
import { NewsItem } from '../../common/types';

const SUBREDDIT_MAP: Record<string, string[]> = {
  technology: ['technology', 'programming', 'gadgets', 'artificial'],
  geopolitics: ['worldnews', 'geopolitics', 'internationalpolitics'],
  business: ['business', 'economy', 'investing', 'wallstreetbets'],
  science: ['science', 'space', 'physics', 'biology'],
  health: ['health', 'medicine', 'nutrition'],
  sports: ['sports', 'nba', 'soccer', 'cricket'],
  entertainment: ['entertainment', 'movies', 'television', 'music'],
  environment: ['environment', 'climate', 'renewableenergy'],
  education: ['education', 'college', 'learnprogramming'],
  general: ['news', 'todayilearned', 'upliftingnews'],
};

@Injectable()
export class RedditAgent extends BaseSearchAgent {
  readonly name = 'reddit';
  readonly platform = 'Reddit';
  private readonly parser = new Parser();
  private readonly logger = new Logger(RedditAgent.name);

  async search(_keywords: string[], categories: string[]): Promise<NewsItem[]> {
    const allItems: NewsItem[] = [];

    try {
      for (const category of categories) {
        const subreddits = SUBREDDIT_MAP[category] || SUBREDDIT_MAP['general'];

        for (const subreddit of subreddits.slice(0, 2)) {
          try {
            const url = `https://www.reddit.com/r/${subreddit}/hot.json?limit=10`;
            const response = await fetch(url, {
              headers: {
                'User-Agent': 'NewsCheckerBot/1.0',
                Accept: 'application/json',
              },
            });

            if (!response.ok) {
              // Fallback to RSS
              const rssUrl = `https://www.reddit.com/r/${subreddit}/.rss?limit=10`;
              try {
                const feed = await this.parser.parseURL(rssUrl);
                const items = (feed.items || []).slice(0, 5).map((item) => ({
                  title: this.cleanText(item.title || ''),
                  summary: this.truncate(this.cleanText(item.contentSnippet || item.content || item.title || ''), 300),
                  sourcePlatform: this.platform,
                  sourceName: `r/${subreddit}`,
                  sourceUrl: item.link || '',
                  categorySlug: category,
                  publishedAt: item.pubDate || new Date().toISOString(),
                  contentHash: this.createHash(`reddit-rss-${item.link}`),
                }));
                allItems.push(...items);
              } catch {
                this.logger.warn(`RSS fallback failed for r/${subreddit}`);
              }
              continue;
            }

            const data = await response.json();
            const posts = data?.data?.children || [];

            for (const post of posts.slice(0, 5)) {
              const p = post.data;
              if (p.stickied || p.over_18) continue;

              allItems.push({
                title: this.cleanText(p.title || ''),
                summary: this.truncate(this.cleanText(p.selftext || p.title || ''), 300),
                sourcePlatform: this.platform,
                sourceName: `r/${subreddit}`,
                sourceUrl: `https://www.reddit.com${p.permalink || ''}`,
                categorySlug: category,
                publishedAt: new Date((p.created_utc || 0) * 1000).toISOString(),
                contentHash: this.createHash(`reddit-${p.id}`),
              });
            }
          } catch (err) {
            this.logger.warn(`Failed to fetch r/${subreddit}: ${err}`);
          }
        }
      }

      this.logger.log(`Reddit: fetched ${allItems.length} items`);
    } catch (error) {
      this.logger.error(`Reddit agent error: ${error}`);
    }

    return allItems;
  }
}
