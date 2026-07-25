"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var DevToAgent_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.DevToAgent = void 0;
const common_1 = require("@nestjs/common");
const base_search_agent_1 = require("./base-search.agent");
const TAG_MAP = {
    technology: ['javascript', 'python', 'webdev', 'devops', 'ai'],
    science: ['datascience', 'machinelearning', 'physics'],
    business: ['startup', 'saas', 'career'],
    education: ['tutorial', 'beginners', 'learning'],
    general: ['news', 'discuss', 'productivity'],
};
let DevToAgent = DevToAgent_1 = class DevToAgent extends base_search_agent_1.BaseSearchAgent {
    name = 'devto';
    platform = 'DEV.to';
    logger = new common_1.Logger(DevToAgent_1.name);
    baseUrl = 'https://dev.to/api';
    async search(_keywords, categories) {
        const allItems = [];
        try {
            try {
                const topUrl = `${this.baseUrl}/articles?top=1&per_page=10`;
                const response = await fetch(topUrl, {
                    headers: { 'User-Agent': 'NewsCheckerBot/1.0' },
                });
                const articles = await response.json();
                if (Array.isArray(articles)) {
                    for (const article of articles) {
                        allItems.push({
                            title: this.cleanText(article.title || ''),
                            summary: this.truncate(this.cleanText(article.description || ''), 300),
                            sourcePlatform: this.platform,
                            sourceName: article.user?.name || 'DEV.to',
                            sourceUrl: article.url || '',
                            categorySlug: 'technology',
                            publishedAt: article.published_at || new Date().toISOString(),
                            contentHash: this.createHash(`devto-${article.id}`),
                        });
                    }
                }
            }
            catch (err) {
                this.logger.warn(`Failed to fetch DEV.to top articles: ${err}`);
            }
            for (const category of categories.slice(0, 2)) {
                const tags = TAG_MAP[category] || TAG_MAP['general'];
                for (const tag of tags.slice(0, 2)) {
                    try {
                        const tagUrl = `${this.baseUrl}/articles?tag=${tag}&top=1&per_page=5`;
                        const response = await fetch(tagUrl, {
                            headers: { 'User-Agent': 'NewsCheckerBot/1.0' },
                        });
                        const articles = await response.json();
                        if (Array.isArray(articles)) {
                            for (const article of articles) {
                                allItems.push({
                                    title: this.cleanText(article.title || ''),
                                    summary: this.truncate(this.cleanText(article.description || ''), 300),
                                    sourcePlatform: this.platform,
                                    sourceName: article.user?.name || 'DEV.to',
                                    sourceUrl: article.url || '',
                                    categorySlug: category,
                                    publishedAt: article.published_at || new Date().toISOString(),
                                    contentHash: this.createHash(`devto-${article.id}`),
                                });
                            }
                        }
                    }
                    catch (err) {
                        this.logger.warn(`Failed DEV.to fetch for tag "${tag}": ${err}`);
                    }
                }
            }
            this.logger.log(`DEV.to: fetched ${allItems.length} items`);
        }
        catch (error) {
            this.logger.error(`DEV.to agent error: ${error}`);
        }
        return allItems;
    }
};
exports.DevToAgent = DevToAgent;
exports.DevToAgent = DevToAgent = DevToAgent_1 = __decorate([
    (0, common_1.Injectable)()
], DevToAgent);
//# sourceMappingURL=devto.agent.js.map