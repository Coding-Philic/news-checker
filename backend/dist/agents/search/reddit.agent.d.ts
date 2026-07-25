import { BaseSearchAgent } from './base-search.agent';
import { NewsItem } from '../../common/types';
export declare class RedditAgent extends BaseSearchAgent {
    readonly name = "reddit";
    readonly platform = "Reddit";
    private readonly parser;
    private readonly logger;
    search(_keywords: string[], categories: string[]): Promise<NewsItem[]>;
}
