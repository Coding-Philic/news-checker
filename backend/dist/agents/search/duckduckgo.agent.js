"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var DuckDuckGoAgent_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.DuckDuckGoAgent = void 0;
const common_1 = require("@nestjs/common");
const base_search_agent_1 = require("./base-search.agent");
let DuckDuckGoAgent = DuckDuckGoAgent_1 = class DuckDuckGoAgent extends base_search_agent_1.BaseSearchAgent {
    name = 'duckduckgo';
    platform = 'DuckDuckGo';
    logger = new common_1.Logger(DuckDuckGoAgent_1.name);
    async search(keywords, categories) {
        const allItems = [];
        try {
            const searchTerms = [
                ...keywords.slice(0, 3),
                ...categories.slice(0, 2).map((c) => `${c} news today`),
            ];
            for (const term of searchTerms) {
                try {
                    const url = `https://api.duckduckgo.com/?q=${encodeURIComponent(term)}&format=json&no_html=1&skip_disambig=1`;
                    const response = await fetch(url);
                    const data = await response.json();
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
                }
                catch (err) {
                    this.logger.warn(`Failed DDG search for "${term}": ${err}`);
                }
            }
            this.logger.log(`DuckDuckGo: fetched ${allItems.length} items`);
        }
        catch (error) {
            this.logger.error(`DuckDuckGo agent error: ${error}`);
        }
        return allItems;
    }
};
exports.DuckDuckGoAgent = DuckDuckGoAgent;
exports.DuckDuckGoAgent = DuckDuckGoAgent = DuckDuckGoAgent_1 = __decorate([
    (0, common_1.Injectable)()
], DuckDuckGoAgent);
//# sourceMappingURL=duckduckgo.agent.js.map