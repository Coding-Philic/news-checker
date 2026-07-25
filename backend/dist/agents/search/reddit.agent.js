"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var RedditAgent_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RedditAgent = void 0;
const common_1 = require("@nestjs/common");
const rss_parser_1 = __importDefault(require("rss-parser"));
const base_search_agent_1 = require("./base-search.agent");
const SUBREDDIT_MAP = {
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
let RedditAgent = RedditAgent_1 = class RedditAgent extends base_search_agent_1.BaseSearchAgent {
    name = 'reddit';
    platform = 'Reddit';
    parser = new rss_parser_1.default();
    logger = new common_1.Logger(RedditAgent_1.name);
    async search(_keywords, categories) {
        const allItems = [];
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
                            }
                            catch {
                                this.logger.warn(`RSS fallback failed for r/${subreddit}`);
                            }
                            continue;
                        }
                        const data = await response.json();
                        const posts = data?.data?.children || [];
                        for (const post of posts.slice(0, 5)) {
                            const p = post.data;
                            if (p.stickied || p.over_18)
                                continue;
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
                    }
                    catch (err) {
                        this.logger.warn(`Failed to fetch r/${subreddit}: ${err}`);
                    }
                }
            }
            this.logger.log(`Reddit: fetched ${allItems.length} items`);
        }
        catch (error) {
            this.logger.error(`Reddit agent error: ${error}`);
        }
        return allItems;
    }
};
exports.RedditAgent = RedditAgent;
exports.RedditAgent = RedditAgent = RedditAgent_1 = __decorate([
    (0, common_1.Injectable)()
], RedditAgent);
//# sourceMappingURL=reddit.agent.js.map