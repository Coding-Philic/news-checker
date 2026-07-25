import { BaseSearchAgent } from './base-search.agent';
import { NewsItem } from '../../common/types';
export declare class HackerNewsAgent extends BaseSearchAgent {
    readonly name = "hackernews";
    readonly platform = "Hacker News";
    private readonly logger;
    private readonly algoliaUrl;
    search(keywords: string[], _categories: string[]): Promise<NewsItem[]>;
}
