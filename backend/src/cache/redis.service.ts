import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Redis } from '@upstash/redis';

@Injectable()
export class RedisService implements OnModuleInit {
  private client!: Redis;
  private readonly logger = new Logger(RedisService.name);

  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    const url = this.configService.get<string>('redis.url');
    const token = this.configService.get<string>('redis.token');

    if (!url || !token || url === 'your-upstash-redis-url') {
      this.logger.warn('Redis not configured — caching disabled. Set UPSTASH_REDIS_URL and UPSTASH_REDIS_TOKEN to enable.');
      return;
    }

    try {
      this.client = new Redis({ url, token });
      this.logger.log('Redis client initialized (Upstash)');
    } catch (error) {
      this.logger.error('Failed to initialize Redis client', error);
    }
  }

  async get<T>(key: string): Promise<T | null> {
    if (!this.client) return null;
    try {
      const value = await this.client.get<T>(key);
      return value;
    } catch (error) {
      this.logger.warn(`Redis GET error for key "${key}": ${error}`);
      return null;
    }
  }

  async set(key: string, value: unknown, ttlSeconds?: number): Promise<void> {
    if (!this.client) return;
    try {
      if (ttlSeconds) {
        await this.client.set(key, value, { ex: ttlSeconds });
      } else {
        await this.client.set(key, value);
      }
    } catch (error) {
      this.logger.warn(`Redis SET error for key "${key}": ${error}`);
    }
  }

  async del(key: string): Promise<void> {
    if (!this.client) return;
    try {
      await this.client.del(key);
    } catch (error) {
      this.logger.warn(`Redis DEL error for key "${key}": ${error}`);
    }
  }

  async exists(key: string): Promise<boolean> {
    if (!this.client) return false;
    try {
      const result = await this.client.exists(key);
      return result === 1;
    } catch (error) {
      this.logger.warn(`Redis EXISTS error for key "${key}": ${error}`);
      return false;
    }
  }

  async invalidatePattern(pattern: string): Promise<void> {
    if (!this.client) return;
    try {
      const keys = await this.client.keys(pattern);
      if (keys.length > 0) {
        await Promise.all(keys.map((key) => this.client.del(key)));
      }
    } catch (error) {
      this.logger.warn(`Redis invalidate pattern error: ${error}`);
    }
  }
}
