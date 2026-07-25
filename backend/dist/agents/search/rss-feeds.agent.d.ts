import { BaseSearchAgent } from './base-search.agent';
import { NewsItem } from '../../common/types';
export declare class RssFeedsAgent extends BaseSearchAgent {
    readonly name = "rss-feeds";
    readonly platform = "RSS Feeds";
    private readonly parser;
    private readonly logger;
    search(_keywords: string[], categories: string[]): Promise<NewsItem[]>;
}
