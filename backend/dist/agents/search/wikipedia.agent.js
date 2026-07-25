"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var WikipediaAgent_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.WikipediaAgent = void 0;
const common_1 = require("@nestjs/common");
const base_search_agent_1 = require("./base-search.agent");
let WikipediaAgent = WikipediaAgent_1 = class WikipediaAgent extends base_search_agent_1.BaseSearchAgent {
    name = 'wikipedia';
    platform = 'Wikipedia';
    logger = new common_1.Logger(WikipediaAgent_1.name);
    baseUrl = 'https://en.wikipedia.org/w/api.php';
    async search(keywords, _categories) {
        const allItems = [];
        try {
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
            }
            catch (err) {
                this.logger.warn(`Failed to fetch Wikipedia current events: ${err}`);
            }
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
                }
                catch (err) {
                    this.logger.warn(`Failed Wikipedia search for "${keyword}": ${err}`);
                }
            }
            this.logger.log(`Wikipedia: fetched ${allItems.length} items`);
        }
        catch (error) {
            this.logger.error(`Wikipedia agent error: ${error}`);
        }
        return allItems;
    }
};
exports.WikipediaAgent = WikipediaAgent;
exports.WikipediaAgent = WikipediaAgent = WikipediaAgent_1 = __decorate([
    (0, common_1.Injectable)()
], WikipediaAgent);
//# sourceMappingURL=wikipedia.agent.js.map