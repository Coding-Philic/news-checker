import { ConfigService } from '@nestjs/config';
import { RedisService } from '../cache/redis.service';
import { PaginationQuery } from '../common/types';
export declare class NewsService {
    private readonly configService;
    private readonly redisService;
    private readonly supabase;
    private readonly logger;
    constructor(configService: ConfigService, redisService: RedisService);
    getUserFeed(userId: string, query: PaginationQuery): Promise<{}>;
    markAsRead(userId: string, feedItemId: string): Promise<{
        success: boolean;
    }>;
    getPublicFeed(query: PaginationQuery): Promise<{}>;
    getArticleById(id: string): Promise<{
        id: any;
        title: any;
        summary: any;
        source_platform: any;
        source_name: any;
        source_url: any;
        relevance_score: any;
        published_at: any;
        fetched_at: any;
        categories: {
            id: any;
            name: any;
            slug: any;
        }[];
    } | null>;
}
