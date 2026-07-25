export interface NewsItem {
    id?: string;
    title: string;
    summary: string;
    originalTitle?: string;
    sourcePlatform: string;
    sourceName?: string;
    sourceUrl: string;
    categoryId?: number;
    categorySlug?: string;
    relevanceScore?: number;
    publishedAt?: string;
    fetchedAt?: string;
    contentHash?: string;
}
export interface UserProfile {
    id: string;
    displayName?: string;
    email: string;
    timezone: string;
    telegramChatId?: string;
    emailNotifications: boolean;
    telegramNotifications: boolean;
    scheduleTime: string;
    interests: string[];
}
export interface Category {
    id: number;
    name: string;
    slug: string;
    description?: string;
}
export interface AgentState {
    userInterests: string[];
    userId: string;
    runId: string;
    searchResults: Record<string, NewsItem[]>;
    filteredResults: Record<string, NewsItem[]>;
    aggregatedResults: NewsItem[];
    distributionStatus: {
        telegram: boolean;
        email: boolean;
    };
    errors: string[];
    iterationCount: number;
}
export interface AgentRunLog {
    id: string;
    runType: 'scheduled' | 'manual';
    triggeredBy: string;
    status: 'pending' | 'running' | 'completed' | 'failed';
    categories: string[];
    itemsFound: number;
    itemsFiltered: number;
    itemsDelivered: number;
    startedAt: string;
    completedAt?: string;
    errorLog?: string;
}
export interface ApiResponse<T> {
    success: boolean;
    data: T;
    message?: string;
    meta?: {
        page?: number;
        limit?: number;
        total?: number;
    };
}
export interface PaginationQuery {
    page?: number;
    limit?: number;
    category?: string;
    source?: string;
}
