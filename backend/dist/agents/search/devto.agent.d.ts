import { BaseSearchAgent } from './base-search.agent';
import { NewsItem } from '../../common/types';
export declare class DevToAgent extends BaseSearchAgent {
    readonly name = "devto";
    readonly platform = "DEV.to";
    private readonly logger;
    private readonly baseUrl;
    search(_keywords: string[], categories: string[]): Promise<NewsItem[]>;
}
