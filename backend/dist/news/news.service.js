"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var NewsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.NewsService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const supabase_js_1 = require("@supabase/supabase-js");
const redis_service_1 = require("../cache/redis.service");
let NewsService = NewsService_1 = class NewsService {
    configService;
    redisService;
    supabase;
    logger = new common_1.Logger(NewsService_1.name);
    constructor(configService, redisService) {
        this.configService = configService;
        this.redisService = redisService;
        this.supabase = (0, supabase_js_1.createClient)(this.configService.get('supabase.url'), this.configService.get('supabase.serviceRoleKey'));
    }
    async getUserFeed(userId, query) {
        const page = query.page || 1;
        const limit = query.limit || 20;
        const offset = (page - 1) * limit;
        const cacheKey = `feed:user:${userId}:${page}:${limit}:${query.category || 'all'}:${query.source || 'all'}`;
        const cached = await this.redisService.get(cacheKey);
        if (cached)
            return cached;
        try {
            let dbQuery = this.supabase
                .from('user_news_feed')
                .select(`
          id,
          delivered_via,
          delivered_at,
          is_read,
          news_items (
            id,
            title,
            summary,
            source_platform,
            source_name,
            source_url,
            relevance_score,
            published_at,
            fetched_at,
            categories (
              id,
              name,
              slug
            )
          )
        `, { count: 'exact' })
                .eq('user_id', userId)
                .order('delivered_at', { ascending: false })
                .range(offset, offset + limit - 1);
            if (query.category) {
                dbQuery = dbQuery.eq('news_items.categories.slug', query.category);
            }
            if (query.source) {
                dbQuery = dbQuery.eq('news_items.source_platform', query.source);
            }
            const { data, error, count } = await dbQuery;
            if (error) {
                this.logger.error(`Feed query error: ${error.message}`);
                return { items: [], total: 0, page, limit };
            }
            const result = {
                items: (data || [])
                    .filter((item) => item.news_items)
                    .map((item) => ({
                    feedId: item.id,
                    deliveredVia: item.delivered_via,
                    deliveredAt: item.delivered_at,
                    isRead: item.is_read,
                    ...item.news_items,
                })),
                total: count || 0,
                page,
                limit,
            };
            await this.redisService.set(cacheKey, result, 900);
            return result;
        }
        catch (error) {
            this.logger.error(`Feed fetch error: ${error}`);
            return { items: [], total: 0, page, limit };
        }
    }
    async markAsRead(userId, feedItemId) {
        const { error } = await this.supabase
            .from('user_news_feed')
            .update({ is_read: true })
            .eq('id', feedItemId)
            .eq('user_id', userId);
        if (error) {
            this.logger.error(`Mark read error: ${error.message}`);
        }
        await this.redisService.invalidatePattern(`feed:user:${userId}:*`);
        return { success: !error };
    }
    async getPublicFeed(query) {
        const page = query.page || 1;
        const limit = query.limit || 20;
        const offset = (page - 1) * limit;
        const cacheKey = `news:public:${page}:${limit}:${query.category || 'all'}`;
        const cached = await this.redisService.get(cacheKey);
        if (cached)
            return cached;
        let dbQuery = this.supabase
            .from('news_items')
            .select(`
        id,
        title,
        summary,
        source_platform,
        source_name,
        source_url,
        relevance_score,
        published_at,
        fetched_at,
        categories (
          id,
          name,
          slug
        )
      `, { count: 'exact' })
            .order('fetched_at', { ascending: false })
            .range(offset, offset + limit - 1);
        if (query.category) {
            dbQuery = dbQuery.eq('categories.slug', query.category);
        }
        const { data, error, count } = await dbQuery;
        if (error) {
            this.logger.error(`Public feed error: ${error.message}`);
            return { items: [], total: 0, page, limit };
        }
        const result = {
            items: data || [],
            total: count || 0,
            page,
            limit,
        };
        await this.redisService.set(cacheKey, result, 3600);
        return result;
    }
    async getArticleById(id) {
        const { data, error } = await this.supabase
            .from('news_items')
            .select(`
        id,
        title,
        summary,
        source_platform,
        source_name,
        source_url,
        relevance_score,
        published_at,
        fetched_at,
        categories (
          id,
          name,
          slug
        )
      `)
            .eq('id', id)
            .single();
        if (error) {
            this.logger.error(`Get article error: ${error.message}`);
            return null;
        }
        return data;
    }
};
exports.NewsService = NewsService;
exports.NewsService = NewsService = NewsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService,
        redis_service_1.RedisService])
], NewsService);
//# sourceMappingURL=news.service.js.map