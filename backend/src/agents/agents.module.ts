import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { OrchestratorService } from './orchestrator/orchestrator.service';
import { GoogleNewsAgent } from './search/google-news.agent';
import { WikipediaAgent } from './search/wikipedia.agent';
import { RedditAgent } from './search/reddit.agent';
import { NewsDataAgent } from './search/newsdata.agent';
import { HackerNewsAgent } from './search/hackernews.agent';
import { DevToAgent } from './search/devto.agent';
import { DuckDuckGoAgent } from './search/duckduckgo.agent';
import { RssFeedsAgent } from './search/rss-feeds.agent';
import { RelevanceFilterAgent } from './filter/relevance-filter.agent';
import { AggregatorAgent } from './aggregator/aggregator.agent';
import { DistributionAgent } from './distribution/distribution.agent';
import { TelegramService } from './distribution/telegram.service';
import { EmailService } from './distribution/email.service';

import { UsersModule } from '../users/users.module';

@Module({
  imports: [ConfigModule, UsersModule],
  providers: [
    OrchestratorService,
    GoogleNewsAgent,
    WikipediaAgent,
    RedditAgent,
    NewsDataAgent,
    HackerNewsAgent,
    DevToAgent,
    DuckDuckGoAgent,
    RssFeedsAgent,
    RelevanceFilterAgent,
    AggregatorAgent,
    DistributionAgent,
    TelegramService,
    EmailService,
  ],
  exports: [OrchestratorService],
})
export class AgentsModule {}
