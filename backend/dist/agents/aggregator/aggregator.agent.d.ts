import { NewsItem } from '../../common/types';
export declare class AggregatorAgent {
    private readonly logger;
    aggregate(allFilteredResults: Record<string, NewsItem[]>): NewsItem[];
    private similarity;
}
