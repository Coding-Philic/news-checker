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
var GoogleNewsAgent_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.GoogleNewsAgent = void 0;
const common_1 = require("@nestjs/common");
const rss_parser_1 = __importDefault(require("rss-parser"));
const base_search_agent_1 = require("./base-search.agent");
const TOPIC_MAP = {
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
let GoogleNewsAgent = GoogleNewsAgent_1 = class GoogleNewsAgent extends base_search_agent_1.BaseSearchAgent {
    name = 'google-news';
    platform = 'Google News';
    parser = new rss_parser_1.default();
    logger = new common_1.Logger(GoogleNewsAgent_1.name);
    baseUrl = 'https://news.google.com/rss';
    async search(keywords, categories) {
        const allItems = [];
        try {
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
                }
                catch (err) {
                    this.logger.warn(`Failed to fetch Google News topic ${topic}: ${err}`);
                }
            }
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
                }
                catch (err) {
                    this.logger.warn(`Failed to search Google News for "${keyword}": ${err}`);
                }
            }
            this.logger.log(`Google News: fetched ${allItems.length} items`);
        }
        catch (error) {
            this.logger.error(`Google News agent error: ${error}`);
        }
        return allItems;
    }
};
exports.GoogleNewsAgent = GoogleNewsAgent;
exports.GoogleNewsAgent = GoogleNewsAgent = GoogleNewsAgent_1 = __decorate([
    (0, common_1.Injectable)()
], GoogleNewsAgent);
//# sourceMappingURL=google-news.agent.js.map