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
var RedisService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RedisService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const redis_1 = require("@upstash/redis");
let RedisService = RedisService_1 = class RedisService {
    configService;
    client;
    logger = new common_1.Logger(RedisService_1.name);
    constructor(configService) {
        this.configService = configService;
    }
    onModuleInit() {
        const url = this.configService.get('redis.url');
        const token = this.configService.get('redis.token');
        if (!url || !token || url === 'your-upstash-redis-url') {
            this.logger.warn('Redis not configured — caching disabled. Set UPSTASH_REDIS_URL and UPSTASH_REDIS_TOKEN to enable.');
            return;
        }
        try {
            this.client = new redis_1.Redis({ url, token });
            this.logger.log('Redis client initialized (Upstash)');
        }
        catch (error) {
            this.logger.error('Failed to initialize Redis client', error);
        }
    }
    async get(key) {
        if (!this.client)
            return null;
        try {
            const value = await this.client.get(key);
            return value;
        }
        catch (error) {
            this.logger.warn(`Redis GET error for key "${key}": ${error}`);
            return null;
        }
    }
    async set(key, value, ttlSeconds) {
        if (!this.client)
            return;
        try {
            if (ttlSeconds) {
                await this.client.set(key, value, { ex: ttlSeconds });
            }
            else {
                await this.client.set(key, value);
            }
        }
        catch (error) {
            this.logger.warn(`Redis SET error for key "${key}": ${error}`);
        }
    }
    async del(key) {
        if (!this.client)
            return;
        try {
            await this.client.del(key);
        }
        catch (error) {
            this.logger.warn(`Redis DEL error for key "${key}": ${error}`);
        }
    }
    async exists(key) {
        if (!this.client)
            return false;
        try {
            const result = await this.client.exists(key);
            return result === 1;
        }
        catch (error) {
            this.logger.warn(`Redis EXISTS error for key "${key}": ${error}`);
            return false;
        }
    }
    async invalidatePattern(pattern) {
        if (!this.client)
            return;
        try {
            const keys = await this.client.keys(pattern);
            if (keys.length > 0) {
                await Promise.all(keys.map((key) => this.client.del(key)));
            }
        }
        catch (error) {
            this.logger.warn(`Redis invalidate pattern error: ${error}`);
        }
    }
};
exports.RedisService = RedisService;
exports.RedisService = RedisService = RedisService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], RedisService);
//# sourceMappingURL=redis.service.js.map