import { OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Category } from '../common/types';
export declare class CategoriesService implements OnModuleInit {
    private readonly configService;
    private readonly supabase;
    private readonly logger;
    constructor(configService: ConfigService);
    onModuleInit(): Promise<void>;
    private seedCategories;
    getAll(): Promise<Category[]>;
    getBySlug(slug: string): Promise<Category | null>;
    getIdBySlug(slug: string): Promise<number | null>;
}
