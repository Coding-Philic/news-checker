import { BaseSearchAgent } from './base-search.agent';
import { NewsItem } from '../../common/types';
export declare class GoogleNewsAgent extends BaseSearchAgent {
    readonly name = "google-news";
    readonly platform = "Google News";
    private readonly parser;
    private readonly logger;
    private readonly baseUrl;
    search(keywords: string[], categories: string[]): Promise<NewsItem[]>;
}
