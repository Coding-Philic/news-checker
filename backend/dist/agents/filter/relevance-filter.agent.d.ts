import { ConfigService } from '@nestjs/config';
import { NewsItem } from '../../common/types';
export declare class RelevanceFilterAgent {
    private readonly configService;
    private readonly logger;
    private readonly groqApiKey;
    private readonly fallbackModels;
    constructor(configService: ConfigService);
    private getModelForSource;
    triageHeadlines(items: NewsItem[], userCategories: string[], sourceName: string): Promise<NewsItem[]>;
    truncateForTokenShield(item: NewsItem, maxWords?: number): {
        title: string;
        text: string;
    };
    processSummarizationQueue(items: NewsItem[], defaultCooldownSeconds?: number): Promise<NewsItem[]>;
    filterItems(items: NewsItem[], userCategories: string[], sourceName: string): Promise<NewsItem[]>;
    private stage1HeadlineTriage;
    private parseJsonSafely;
    private executeGroqRequest;
    private callGroq;
}
