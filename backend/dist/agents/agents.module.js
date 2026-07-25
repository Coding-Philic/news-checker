"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgentsModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const orchestrator_service_1 = require("./orchestrator/orchestrator.service");
const google_news_agent_1 = require("./search/google-news.agent");
const wikipedia_agent_1 = require("./search/wikipedia.agent");
const reddit_agent_1 = require("./search/reddit.agent");
const newsdata_agent_1 = require("./search/newsdata.agent");
const hackernews_agent_1 = require("./search/hackernews.agent");
const devto_agent_1 = require("./search/devto.agent");
const duckduckgo_agent_1 = require("./search/duckduckgo.agent");
const rss_feeds_agent_1 = require("./search/rss-feeds.agent");
const relevance_filter_agent_1 = require("./filter/relevance-filter.agent");
const aggregator_agent_1 = require("./aggregator/aggregator.agent");
const distribution_agent_1 = require("./distribution/distribution.agent");
const telegram_service_1 = require("./distribution/telegram.service");
const email_service_1 = require("./distribution/email.service");
const users_module_1 = require("../users/users.module");
let AgentsModule = class AgentsModule {
};
exports.AgentsModule = AgentsModule;
exports.AgentsModule = AgentsModule = __decorate([
    (0, common_1.Module)({
        imports: [config_1.ConfigModule, users_module_1.UsersModule],
        providers: [
            orchestrator_service_1.OrchestratorService,
            google_news_agent_1.GoogleNewsAgent,
            wikipedia_agent_1.WikipediaAgent,
            reddit_agent_1.RedditAgent,
            newsdata_agent_1.NewsDataAgent,
            hackernews_agent_1.HackerNewsAgent,
            devto_agent_1.DevToAgent,
            duckduckgo_agent_1.DuckDuckGoAgent,
            rss_feeds_agent_1.RssFeedsAgent,
            relevance_filter_agent_1.RelevanceFilterAgent,
            aggregator_agent_1.AggregatorAgent,
            distribution_agent_1.DistributionAgent,
            telegram_service_1.TelegramService,
            email_service_1.EmailService,
        ],
        exports: [orchestrator_service_1.OrchestratorService],
    })
], AgentsModule);
//# sourceMappingURL=agents.module.js.map