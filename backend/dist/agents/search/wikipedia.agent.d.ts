import { BaseSearchAgent } from './base-search.agent';
import { NewsItem } from '../../common/types';
export declare class WikipediaAgent extends BaseSearchAgent {
    readonly name = "wikipedia";
    readonly platform = "Wikipedia";
    private readonly logger;
    private readonly baseUrl;
    search(keywords: string[], _categories: string[]): Promise<NewsItem[]>;
}
