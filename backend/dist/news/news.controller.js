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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NewsController = void 0;
const common_1 = require("@nestjs/common");
const news_service_1 = require("./news.service");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const current_user_decorator_1 = require("../auth/decorators/current-user.decorator");
const orchestrator_service_1 = require("../agents/orchestrator/orchestrator.service");
const users_service_1 = require("../users/users.service");
let NewsController = class NewsController {
    newsService;
    orchestratorService;
    usersService;
    constructor(newsService, orchestratorService, usersService) {
        this.newsService = newsService;
        this.orchestratorService = orchestratorService;
        this.usersService = usersService;
    }
    async getUserFeed(userId, page, limit, category, source) {
        return this.newsService.getUserFeed(userId, {
            page: page ? parseInt(page, 10) : 1,
            limit: limit ? parseInt(limit, 10) : 20,
            category,
            source,
        });
    }
    async getPublicFeed(page, limit, category) {
        return this.newsService.getPublicFeed({
            page: page ? parseInt(page, 10) : 1,
            limit: limit ? parseInt(limit, 10) : 20,
            category,
        });
    }
    async triggerWelcomeSearch(userId) {
        const userProfile = await this.usersService.getProfile(userId);
        if (!userProfile) {
            return { error: 'User profile not found' };
        }
        const runPromise = this.orchestratorService.runForUser(userProfile, 'scheduled');
        runPromise.catch((error) => {
            console.error(`Background welcome run failed for user ${userId}:`, error);
        });
        return {
            message: 'Welcome digest triggered successfully',
            status: 'running',
        };
    }
    async triggerSearch(userId) {
        const userProfile = await this.usersService.getProfile(userId);
        if (!userProfile) {
            return { error: 'User profile not found' };
        }
        const runPromise = this.orchestratorService.runForUser(userProfile, 'manual');
        runPromise.catch((error) => {
            console.error(`Background run failed for user ${userId}:`, error);
        });
        return {
            message: 'News search triggered successfully. Check status for updates.',
            status: 'running',
        };
    }
    async getRunStatus(runId) {
        return this.orchestratorService.getRunStatus(runId);
    }
    async markAsRead(userId, feedItemId) {
        return this.newsService.markAsRead(userId, feedItemId);
    }
    async getArticle(id) {
        const article = await this.newsService.getArticleById(id);
        if (!article) {
            return { error: 'Article not found' };
        }
        return { data: article };
    }
};
exports.NewsController = NewsController;
__decorate([
    (0, common_1.Get)('feed'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Query)('page')),
    __param(2, (0, common_1.Query)('limit')),
    __param(3, (0, common_1.Query)('category')),
    __param(4, (0, common_1.Query)('source')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, String]),
    __metadata("design:returntype", Promise)
], NewsController.prototype, "getUserFeed", null);
__decorate([
    (0, common_1.Get)('public'),
    __param(0, (0, common_1.Query)('page')),
    __param(1, (0, common_1.Query)('limit')),
    __param(2, (0, common_1.Query)('category')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], NewsController.prototype, "getPublicFeed", null);
__decorate([
    (0, common_1.Post)('trigger-welcome'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.HttpCode)(common_1.HttpStatus.ACCEPTED),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], NewsController.prototype, "triggerWelcomeSearch", null);
__decorate([
    (0, common_1.Post)('trigger'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.HttpCode)(common_1.HttpStatus.ACCEPTED),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], NewsController.prototype, "triggerSearch", null);
__decorate([
    (0, common_1.Get)('status/:runId'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Param)('runId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], NewsController.prototype, "getRunStatus", null);
__decorate([
    (0, common_1.Post)('read/:feedItemId'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Param)('feedItemId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], NewsController.prototype, "markAsRead", null);
__decorate([
    (0, common_1.Get)('article/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], NewsController.prototype, "getArticle", null);
exports.NewsController = NewsController = __decorate([
    (0, common_1.Controller)('api/news'),
    __metadata("design:paramtypes", [news_service_1.NewsService,
        orchestrator_service_1.OrchestratorService,
        users_service_1.UsersService])
], NewsController);
//# sourceMappingURL=news.controller.js.map