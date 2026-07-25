import { ConfigService } from '@nestjs/config';
import { BaseSearchAgent } from './base-search.agent';
import { NewsItem } from '../../common/types';
export declare class NewsDataAgent extends BaseSearchAgent {
    private readonly configService;
    readonly name = "newsdata";
    readonly platform = "NewsData.io";
    private readonly logger;
    private readonly apiKey;
    constructor(configService: ConfigService);
    search(_keywords: string[], categories: string[]): Promise<NewsItem[]>;
}
