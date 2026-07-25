"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var NewsDataAgent_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.NewsDataAgent = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const base_search_agent_1 = require("./base-search.agent");
const CATEGORY_MAP = {
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
let NewsDataAgent = NewsDataAgent_1 = class NewsDataAgent extends base_search_agent_1.BaseSearchAgent {
    configService;
    name = 'newsdata';
    platform = 'NewsData.io';
    logger = new common_1.Logger(NewsDataAgent_1.name);
    apiKey;
    constructor(configService) {
        super();
        this.configService = configService;
        this.apiKey = this.configService.get('newsdata.apiKey') || '';
    }
    async search(_keywords, categories) {
        const allItems = [];
        if (!this.apiKey) {
            this.logger.warn('NewsData.io API key not configured, skipping');
            return allItems;
        }
        try {
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
                }
                catch (err) {
                    this.logger.warn(`Failed NewsData.io fetch for ${apiCategory}: ${err}`);
                }
            }
            this.logger.log(`NewsData.io: fetched ${allItems.length} items`);
        }
        catch (error) {
            this.logger.error(`NewsData agent error: ${error}`);
        }
        return allItems;
    }
};
exports.NewsDataAgent = NewsDataAgent;
exports.NewsDataAgent = NewsDataAgent = NewsDataAgent_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], NewsDataAgent);
//# sourceMappingURL=newsdata.agent.js.map