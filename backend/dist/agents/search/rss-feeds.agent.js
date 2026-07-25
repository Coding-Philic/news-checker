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
var RssFeedsAgent_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RssFeedsAgent = void 0;
const common_1 = require("@nestjs/common");
const rss_parser_1 = __importDefault(require("rss-parser"));
const base_search_agent_1 = require("./base-search.agent");
const RSS_SOURCES = {
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
let RssFeedsAgent = RssFeedsAgent_1 = class RssFeedsAgent extends base_search_agent_1.BaseSearchAgent {
    name = 'rss-feeds';
    platform = 'RSS Feeds';
    parser = new rss_parser_1.default({ timeout: 10000 });
    logger = new common_1.Logger(RssFeedsAgent_1.name);
    async search(_keywords, categories) {
        const allItems = [];
        try {
            for (const category of categories) {
                const sources = RSS_SOURCES[category] || RSS_SOURCES['general'];
                for (const source of sources) {
                    try {
                        const feed = await this.parser.parseURL(source.url);
                        const items = (feed.items || []).slice(0, 5).map((item) => ({
                            title: this.cleanText(item.title || ''),
                            summary: this.truncate(this.cleanText(item.contentSnippet || item.content || item.title || ''), 400),
                            originalTitle: item.title || '',
                            sourcePlatform: this.platform,
                            sourceName: source.name,
                            sourceUrl: item.link || '',
                            categorySlug: category,
                            publishedAt: item.pubDate || item.isoDate || new Date().toISOString(),
                            contentHash: this.createHash(`rss-${source.name}-${item.link}`),
                        }));
                        allItems.push(...items);
                    }
                    catch (err) {
                        this.logger.warn(`Failed RSS fetch from ${source.name}: ${err}`);
                    }
                }
            }
            this.logger.log(`RSS Feeds: fetched ${allItems.length} items`);
        }
        catch (error) {
            this.logger.error(`RSS Feeds agent error: ${error}`);
        }
        return allItems;
    }
};
exports.RssFeedsAgent = RssFeedsAgent;
exports.RssFeedsAgent = RssFeedsAgent = RssFeedsAgent_1 = __decorate([
    (0, common_1.Injectable)()
], RssFeedsAgent);
//# sourceMappingURL=rss-feeds.agent.js.map