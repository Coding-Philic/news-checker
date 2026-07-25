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
var OrchestratorService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrchestratorService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const supabase_js_1 = require("@supabase/supabase-js");
const redis_service_1 = require("../../cache/redis.service");
const google_news_agent_1 = require("../search/google-news.agent");
const wikipedia_agent_1 = require("../search/wikipedia.agent");
const reddit_agent_1 = require("../search/reddit.agent");
const newsdata_agent_1 = require("../search/newsdata.agent");
const hackernews_agent_1 = require("../search/hackernews.agent");
const devto_agent_1 = require("../search/devto.agent");
const duckduckgo_agent_1 = require("../search/duckduckgo.agent");
const rss_feeds_agent_1 = require("../search/rss-feeds.agent");
const relevance_filter_agent_1 = require("../filter/relevance-filter.agent");
const aggregator_agent_1 = require("../aggregator/aggregator.agent");
const distribution_agent_1 = require("../distribution/distribution.agent");
const uuid_1 = require("uuid");
let OrchestratorService = OrchestratorService_1 = class OrchestratorService {
    configService;
    redisService;
    googleNewsAgent;
    wikipediaAgent;
    redditAgent;
    newsDataAgent;
    hackerNewsAgent;
    devToAgent;
    duckDuckGoAgent;
    rssFeedsAgent;
    filterAgent;
    aggregatorAgent;
    distributionAgent;
    logger = new common_1.Logger(OrchestratorService_1.name);
    supabase;
    constructor(configService, redisService, googleNewsAgent, wikipediaAgent, redditAgent, newsDataAgent, hackerNewsAgent, devToAgent, duckDuckGoAgent, rssFeedsAgent, filterAgent, aggregatorAgent, distributionAgent) {
        this.configService = configService;
        this.redisService = redisService;
        this.googleNewsAgent = googleNewsAgent;
        this.wikipediaAgent = wikipediaAgent;
        this.redditAgent = redditAgent;
        this.newsDataAgent = newsDataAgent;
        this.hackerNewsAgent = hackerNewsAgent;
        this.devToAgent = devToAgent;
        this.duckDuckGoAgent = duckDuckGoAgent;
        this.rssFeedsAgent = rssFeedsAgent;
        this.filterAgent = filterAgent;
        this.aggregatorAgent = aggregatorAgent;
        this.distributionAgent = distributionAgent;
        this.supabase = (0, supabase_js_1.createClient)(this.configService.get('supabase.url'), this.configService.get('supabase.serviceRoleKey'));
    }
    async runForUser(user, triggerType = 'manual') {
        const runId = (0, uuid_1.v4)();
        const runLog = {
            id: runId,
            runType: triggerType,
            triggeredBy: user.id,
            status: 'running',
            categories: user.interests,
            itemsFound: 0,
            itemsFiltered: 0,
            itemsDelivered: 0,
            startedAt: new Date().toISOString(),
        };
        await this.supabase.from('agent_runs').insert({
            id: runId,
            run_type: triggerType,
            triggered_by: user.id,
            status: 'running',
            categories: user.interests,
            started_at: runLog.startedAt,
        });
        try {
            this.logger.log(`[Run ${runId}] Starting for user ${user.id} with interests: ${user.interests.join(', ')}`);
            const keywords = this.generateKeywords(user.interests);
            this.logger.log(`[Run ${runId}] Step 1: Searching across 8 sources...`);
            const searchResults = await Promise.allSettled([
                this.cachedSearch('google-news', () => this.googleNewsAgent.search(keywords, user.interests)),
                this.cachedSearch('wikipedia', () => this.wikipediaAgent.search(keywords, user.interests)),
                this.cachedSearch('reddit', () => this.redditAgent.search(keywords, user.interests)),
                this.cachedSearch('newsdata', () => this.newsDataAgent.search(keywords, user.interests)),
                this.cachedSearch('hackernews', () => this.hackerNewsAgent.search(keywords, user.interests)),
                this.cachedSearch('devto', () => this.devToAgent.search(keywords, user.interests)),
                this.cachedSearch('duckduckgo', () => this.duckDuckGoAgent.search(keywords, user.interests)),
                this.cachedSearch('rss-feeds', () => this.rssFeedsAgent.search(keywords, user.interests)),
            ]);
            const sourceNames = [
                'google-news', 'wikipedia', 'reddit', 'newsdata',
                'hackernews', 'devto', 'duckduckgo', 'rss-feeds',
            ];
            const rawResults = {};
            let totalFound = 0;
            searchResults.forEach((result, idx) => {
                const name = sourceNames[idx];
                if (result.status === 'fulfilled' && result.value) {
                    rawResults[name] = result.value;
                    totalFound += result.value.length;
                }
                else {
                    rawResults[name] = [];
                    if (result.status === 'rejected') {
                        this.logger.warn(`[Run ${runId}] Search failed for ${name}: ${result.reason}`);
                    }
                }
            });
            runLog.itemsFound = totalFound;
            this.logger.log(`[Run ${runId}] Step 1 complete: ${totalFound} items found`);
            this.logger.log(`[Run ${runId}] Step 2 (Layer 1): Headline Triage across all sources...`);
            const triagedResults = {};
            let totalTriaged = 0;
            for (const [source, items] of Object.entries(rawResults)) {
                if (items.length === 0) {
                    triagedResults[source] = [];
                    continue;
                }
                try {
                    const itemsToProcess = items.slice(0, 15);
                    const triaged = await this.filterAgent.triageHeadlines(itemsToProcess, user.interests, source);
                    triagedResults[source] = triaged;
                    totalTriaged += triaged.length;
                }
                catch (error) {
                    this.logger.warn(`[Run ${runId}] Triage error for ${source}: ${error}`);
                    triagedResults[source] = items.slice(0, 5);
                    totalTriaged += Math.min(items.length, 5);
                }
            }
            runLog.itemsFiltered = totalTriaged;
            this.logger.log(`[Run ${runId}] Layer 1 complete: ${totalTriaged} items approved after triage`);
            this.logger.log(`[Run ${runId}] Step 3 (Layer 2 Prep): Deduplicating triaged items before queue...`);
            const deduplicated = this.aggregatorAgent.aggregate(triagedResults);
            this.logger.log(`[Run ${runId}] Deduplication complete: ${totalTriaged} triaged -> ${deduplicated.length} unique items for queue`);
            this.logger.log(`[Run ${runId}] Step 4 (Layer 2-4): Processing FIFO queue with Token Shield & Cooldown...`);
            const aggregated = await this.filterAgent.processSummarizationQueue(deduplicated, 15);
            await this.storeNewsItems(aggregated, user.id);
            this.logger.log(`[Run ${runId}] Step 4: Distributing...`);
            const distResult = await this.distributionAgent.distribute(user, aggregated);
            runLog.itemsDelivered = aggregated.length;
            runLog.status = 'completed';
            runLog.completedAt = new Date().toISOString();
            await this.supabase
                .from('agent_runs')
                .update({
                status: 'completed',
                items_found: runLog.itemsFound,
                items_filtered: runLog.itemsFiltered,
                items_delivered: runLog.itemsDelivered,
                completed_at: runLog.completedAt,
            })
                .eq('id', runId);
            await this.redisService.del(`feed:user:${user.id}`);
            this.logger.log(`[Run ${runId}] Complete: ${runLog.itemsFound} found -> ${runLog.itemsFiltered} filtered -> ${runLog.itemsDelivered} delivered. Telegram=${distResult.telegram}, Email=${distResult.email}`);
            return runLog;
        }
        catch (error) {
            runLog.status = 'failed';
            runLog.errorLog = String(error);
            runLog.completedAt = new Date().toISOString();
            await this.supabase
                .from('agent_runs')
                .update({
                status: 'failed',
                error_log: String(error),
                completed_at: runLog.completedAt,
            })
                .eq('id', runId);
            this.logger.error(`[Run ${runId}] Failed: ${error}`);
            return runLog;
        }
    }
    async getRunStatus(runId) {
        const { data, error } = await this.supabase
            .from('agent_runs')
            .select('*')
            .eq('id', runId)
            .single();
        if (error || !data)
            return null;
        return {
            id: data.id,
            runType: data.run_type,
            triggeredBy: data.triggered_by,
            status: data.status,
            categories: data.categories || [],
            itemsFound: data.items_found || 0,
            itemsFiltered: data.items_filtered || 0,
            itemsDelivered: data.items_delivered || 0,
            startedAt: data.started_at,
            completedAt: data.completed_at,
            errorLog: data.error_log,
        };
    }
    async cachedSearch(source, searchFn) {
        const cacheKey = `search:${source}:${new Date().toISOString().split('T')[0]}`;
        const cached = await this.redisService.get(cacheKey);
        if (cached) {
            this.logger.log(`Cache hit for ${source}`);
            return cached;
        }
        const results = await searchFn();
        if (results.length > 0) {
            await this.redisService.set(cacheKey, results, 1800);
        }
        return results;
    }
    async storeNewsItems(items, userId) {
        for (const item of items) {
            try {
                const { data: newsItem } = await this.supabase
                    .from('news_items')
                    .upsert({
                    title: item.title,
                    summary: item.summary,
                    original_title: item.originalTitle,
                    source_platform: item.sourcePlatform,
                    source_name: item.sourceName,
                    source_url: item.sourceUrl,
                    category_id: item.categoryId,
                    relevance_score: item.relevanceScore || 5,
                    published_at: item.publishedAt,
                    content_hash: item.contentHash,
                }, { onConflict: 'content_hash' })
                    .select('id')
                    .single();
                if (newsItem) {
                    await this.supabase.from('user_news_feed').insert({
                        user_id: userId,
                        news_item_id: newsItem.id,
                        delivered_via: 'web',
                    });
                }
            }
            catch (error) {
                this.logger.debug(`Store item skip: ${error}`);
            }
        }
    }
    generateKeywords(categories) {
        const keywordMap = {
            technology: ['AI artificial intelligence', 'cybersecurity', 'software update', 'tech news'],
            geopolitics: ['international relations', 'global politics', 'world news today'],
            business: ['stock market', 'startup funding', 'economy news'],
            science: ['scientific discovery', 'space exploration', 'research breakthrough'],
            health: ['public health', 'medical research', 'health news'],
            sports: ['sports news today', 'match results'],
            entertainment: ['movie release', 'entertainment news'],
            environment: ['climate change', 'renewable energy', 'environmental news'],
            education: ['education policy', 'university news'],
            general: ['trending news', 'breaking news today'],
        };
        const keywords = [];
        for (const cat of categories) {
            keywords.push(...(keywordMap[cat] || keywordMap['general']));
        }
        return [...new Set(keywords)].slice(0, 10);
    }
};
exports.OrchestratorService = OrchestratorService;
exports.OrchestratorService = OrchestratorService = OrchestratorService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService,
        redis_service_1.RedisService,
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
        distribution_agent_1.DistributionAgent])
], OrchestratorService);
//# sourceMappingURL=orchestrator.service.js.map