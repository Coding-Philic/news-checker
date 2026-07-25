import { NewsService } from './news.service';
import { OrchestratorService } from '../agents/orchestrator/orchestrator.service';
import { UsersService } from '../users/users.service';
export declare class NewsController {
    private readonly newsService;
    private readonly orchestratorService;
    private readonly usersService;
    constructor(newsService: NewsService, orchestratorService: OrchestratorService, usersService: UsersService);
    getUserFeed(userId: string, page?: string, limit?: string, category?: string, source?: string): Promise<{}>;
    getPublicFeed(page?: string, limit?: string, category?: string): Promise<{}>;
    triggerWelcomeSearch(userId: string): Promise<{
        error: string;
        message?: undefined;
        status?: undefined;
    } | {
        message: string;
        status: string;
        error?: undefined;
    }>;
    triggerSearch(userId: string): Promise<{
        error: string;
        message?: undefined;
        status?: undefined;
    } | {
        message: string;
        status: string;
        error?: undefined;
    }>;
    getRunStatus(runId: string): Promise<import("../common/types").AgentRunLog | null>;
    markAsRead(userId: string, feedItemId: string): Promise<{
        success: boolean;
    }>;
    getArticle(id: string): Promise<{
        error: string;
        data?: undefined;
    } | {
        data: {
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
        };
        error?: undefined;
    }>;
}
