import { OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
export declare class RedisService implements OnModuleInit {
    private readonly configService;
    private client;
    private readonly logger;
    constructor(configService: ConfigService);
    onModuleInit(): void;
    get<T>(key: string): Promise<T | null>;
    set(key: string, value: unknown, ttlSeconds?: number): Promise<void>;
    del(key: string): Promise<void>;
    exists(key: string): Promise<boolean>;
    invalidatePattern(pattern: string): Promise<void>;
}
