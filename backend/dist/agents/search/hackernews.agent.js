"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var HackerNewsAgent_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.HackerNewsAgent = void 0;
const common_1 = require("@nestjs/common");
const base_search_agent_1 = require("./base-search.agent");
let HackerNewsAgent = HackerNewsAgent_1 = class HackerNewsAgent extends base_search_agent_1.BaseSearchAgent {
    name = 'hackernews';
    platform = 'Hacker News';
    logger = new common_1.Logger(HackerNewsAgent_1.name);
    algoliaUrl = 'https://hn.algolia.com/api/v1';
    async search(keywords, _categories) {
        const allItems = [];
        try {
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
            }
            catch (err) {
                this.logger.warn(`Failed to fetch HN front page: ${err}`);
            }
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
                }
                catch (err) {
                    this.logger.warn(`Failed HN search for "${keyword}": ${err}`);
                }
            }
            this.logger.log(`Hacker News: fetched ${allItems.length} items`);
        }
        catch (error) {
            this.logger.error(`Hacker News agent error: ${error}`);
        }
        return allItems;
    }
};
exports.HackerNewsAgent = HackerNewsAgent;
exports.HackerNewsAgent = HackerNewsAgent = HackerNewsAgent_1 = __decorate([
    (0, common_1.Injectable)()
], HackerNewsAgent);
//# sourceMappingURL=hackernews.agent.js.map