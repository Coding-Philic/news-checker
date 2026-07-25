import { BaseSearchAgent } from './base-search.agent';
import { NewsItem } from '../../common/types';
export declare class DuckDuckGoAgent extends BaseSearchAgent {
    readonly name = "duckduckgo";
    readonly platform = "DuckDuckGo";
    private readonly logger;
    search(keywords: string[], categories: string[]): Promise<NewsItem[]>;
}
