import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { NewsItem, UserProfile, AgentRunLog } from '../../common/types';
import { RedisService } from '../../cache/redis.service';
import { GoogleNewsAgent } from '../search/google-news.agent';
import { WikipediaAgent } from '../search/wikipedia.agent';
import { RedditAgent } from '../search/reddit.agent';
import { NewsDataAgent } from '../search/newsdata.agent';
import { HackerNewsAgent } from '../search/hackernews.agent';
import { DevToAgent } from '../search/devto.agent';
import { DuckDuckGoAgent } from '../search/duckduckgo.agent';
import { RssFeedsAgent } from '../search/rss-feeds.agent';
import { RelevanceFilterAgent } from '../filter/relevance-filter.agent';
import { AggregatorAgent } from '../aggregator/aggregator.agent';
import { DistributionAgent } from '../distribution/distribution.agent';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class OrchestratorService {
  private readonly logger = new Logger(OrchestratorService.name);
  private readonly supabase: SupabaseClient;

  constructor(
    private readonly configService: ConfigService,
    private readonly redisService: RedisService,
    private readonly googleNewsAgent: GoogleNewsAgent,
    private readonly wikipediaAgent: WikipediaAgent,
    private readonly redditAgent: RedditAgent,
    private readonly newsDataAgent: NewsDataAgent,
    private readonly hackerNewsAgent: HackerNewsAgent,
    private readonly devToAgent: DevToAgent,
    private readonly duckDuckGoAgent: DuckDuckGoAgent,
    private readonly rssFeedsAgent: RssFeedsAgent,
    private readonly filterAgent: RelevanceFilterAgent,
    private readonly aggregatorAgent: AggregatorAgent,
    private readonly distributionAgent: DistributionAgent,
  ) {
    this.supabase = createClient(
      this.configService.get<string>('supabase.url')!,
      this.configService.get<string>('supabase.serviceRoleKey')!,
    );
  }

  async runForUser(
    user: UserProfile,
    triggerType: 'scheduled' | 'manual' = 'manual',
  ): Promise<AgentRunLog> {
    const runId = uuidv4();
    const runLog: AgentRunLog = {
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

    // Log run start
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

      // STEP 1: Generate search keywords from categories
      const keywords = this.generateKeywords(user.interests);

      // STEP 2: Run all search agents in parallel
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

      const rawResults: Record<string, NewsItem[]> = {};
      let totalFound = 0;

      searchResults.forEach((result, idx) => {
        const name = sourceNames[idx];
        if (result.status === 'fulfilled' && result.value) {
          rawResults[name] = result.value;
          totalFound += result.value.length;
        } else {
          rawResults[name] = [];
          if (result.status === 'rejected') {
            this.logger.warn(`[Run ${runId}] Search failed for ${name}: ${result.reason}`);
          }
        }
      });

      runLog.itemsFound = totalFound;
      this.logger.log(`[Run ${runId}] Step 1 complete: ${totalFound} items found`);

      // STEP 2: Layer 1 Headline Triage across sources
      this.logger.log(`[Run ${runId}] Step 2 (Layer 1): Headline Triage across all sources...`);

      const triagedResults: Record<string, NewsItem[]> = {};
      let totalTriaged = 0;

      for (const [source, items] of Object.entries(rawResults)) {
        if (items.length === 0) {
          triagedResults[source] = [];
          continue;
        }

        try {
          // Limit to max 15 items per source for triage
          const itemsToProcess = items.slice(0, 15);
          const triaged = await this.filterAgent.triageHeadlines(
            itemsToProcess,
            user.interests,
            source,
          );
          triagedResults[source] = triaged;
          totalTriaged += triaged.length;
        } catch (error) {
          this.logger.warn(`[Run ${runId}] Triage error for ${source}: ${error}`);
          triagedResults[source] = items.slice(0, 5);
          totalTriaged += Math.min(items.length, 5);
        }
      }

      runLog.itemsFiltered = totalTriaged;
      this.logger.log(`[Run ${runId}] Layer 1 complete: ${totalTriaged} items approved after triage`);

      // STEP 3: Pre-Summarization Aggregation & Deduplication
      this.logger.log(`[Run ${runId}] Step 3 (Layer 2 Prep): Deduplicating triaged items before queue...`);
      const deduplicated = this.aggregatorAgent.aggregate(triagedResults);
      this.logger.log(`[Run ${runId}] Deduplication complete: ${totalTriaged} triaged -> ${deduplicated.length} unique items for queue`);

      // STEP 4: Layer 2-4 FIFO Summarization Queue with Token Shield
      this.logger.log(`[Run ${runId}] Step 4 (Layer 2-4): Processing FIFO queue with Token Shield & Cooldown...`);
      const aggregated = await this.filterAgent.processSummarizationQueue(deduplicated, 15);

      // STEP 5: Store in database
      await this.storeNewsItems(aggregated, user.id);

      // STEP 6: Distribute via Telegram + Email
      this.logger.log(`[Run ${runId}] Step 4: Distributing...`);
      const distResult = await this.distributionAgent.distribute(user, aggregated);
      runLog.itemsDelivered = aggregated.length;

      // Update run log
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

      // Invalidate user feed cache
      await this.redisService.del(`feed:user:${user.id}`);

      this.logger.log(
        `[Run ${runId}] Complete: ${runLog.itemsFound} found -> ${runLog.itemsFiltered} filtered -> ${runLog.itemsDelivered} delivered. Telegram=${distResult.telegram}, Email=${distResult.email}`,
      );

      return runLog;
    } catch (error) {
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

  async getRunStatus(runId: string): Promise<AgentRunLog | null> {
    const { data, error } = await this.supabase
      .from('agent_runs')
      .select('*')
      .eq('id', runId)
      .single();

    if (error || !data) return null;

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

  private async cachedSearch(
    source: string,
    searchFn: () => Promise<NewsItem[]>,
  ): Promise<NewsItem[]> {
    const cacheKey = `search:${source}:${new Date().toISOString().split('T')[0]}`;

    const cached = await this.redisService.get<NewsItem[]>(cacheKey);
    if (cached) {
      this.logger.log(`Cache hit for ${source}`);
      return cached;
    }

    const results = await searchFn();
    if (results.length > 0) {
      await this.redisService.set(cacheKey, results, 1800); // 30 min TTL
    }

    return results;
  }

  private async storeNewsItems(items: NewsItem[], userId: string): Promise<void> {
    for (const item of items) {
      try {
        // Upsert news item
        const { data: newsItem } = await this.supabase
          .from('news_items')
          .upsert(
            {
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
            },
            { onConflict: 'content_hash' },
          )
          .select('id')
          .single();

        if (newsItem) {
          // Link to user feed
          await this.supabase.from('user_news_feed').insert({
            user_id: userId,
            news_item_id: newsItem.id,
            delivered_via: 'web',
          });
        }
      } catch (error) {
        // Skip duplicates silently
        this.logger.debug(`Store item skip: ${error}`);
      }
    }
  }

  private generateKeywords(categories: string[]): string[] {
    const keywordMap: Record<string, string[]> = {
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

    const keywords: string[] = [];
    for (const cat of categories) {
      keywords.push(...(keywordMap[cat] || keywordMap['general']));
    }

    return [...new Set(keywords)].slice(0, 10);
  }
}
