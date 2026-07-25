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
var CategoriesService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CategoriesService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const supabase_js_1 = require("@supabase/supabase-js");
const DEFAULT_CATEGORIES = [
    { name: 'Technology', slug: 'technology', description: 'Tech news, AI, software, hardware, startups' },
    { name: 'Geopolitics', slug: 'geopolitics', description: 'International relations, politics, global affairs' },
    { name: 'Business & Finance', slug: 'business', description: 'Markets, economy, companies, entrepreneurship' },
    { name: 'Science', slug: 'science', description: 'Research, discoveries, space, physics, biology' },
    { name: 'Health', slug: 'health', description: 'Medical news, wellness, public health' },
    { name: 'Sports', slug: 'sports', description: 'Sports news, scores, athletes, events' },
    { name: 'Entertainment', slug: 'entertainment', description: 'Movies, music, TV, celebrities, culture' },
    { name: 'Environment', slug: 'environment', description: 'Climate change, sustainability, nature' },
    { name: 'Education', slug: 'education', description: 'Education policy, universities, online learning' },
    { name: 'General', slug: 'general', description: 'Trending news, world events, miscellaneous' },
];
let CategoriesService = CategoriesService_1 = class CategoriesService {
    configService;
    supabase;
    logger = new common_1.Logger(CategoriesService_1.name);
    constructor(configService) {
        this.configService = configService;
        this.supabase = (0, supabase_js_1.createClient)(this.configService.get('supabase.url'), this.configService.get('supabase.serviceRoleKey'));
    }
    async onModuleInit() {
        await this.seedCategories();
    }
    async seedCategories() {
        const { data: existing } = await this.supabase
            .from('categories')
            .select('slug');
        const existingSlugs = new Set((existing || []).map((c) => c.slug));
        const toInsert = DEFAULT_CATEGORIES.filter((c) => !existingSlugs.has(c.slug));
        if (toInsert.length > 0) {
            const { error } = await this.supabase.from('categories').insert(toInsert);
            if (error) {
                this.logger.warn(`Category seed warning: ${error.message}`);
            }
            else {
                this.logger.log(`Seeded ${toInsert.length} categories`);
            }
        }
    }
    async getAll() {
        const { data, error } = await this.supabase
            .from('categories')
            .select('*')
            .order('id', { ascending: true });
        if (error) {
            this.logger.error(`Failed to get categories: ${error.message}`);
            return [];
        }
        return data || [];
    }
    async getBySlug(slug) {
        const { data, error } = await this.supabase
            .from('categories')
            .select('*')
            .eq('slug', slug)
            .single();
        if (error)
            return null;
        return data;
    }
    async getIdBySlug(slug) {
        const category = await this.getBySlug(slug);
        return category?.id || null;
    }
};
exports.CategoriesService = CategoriesService;
exports.CategoriesService = CategoriesService = CategoriesService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], CategoriesService);
//# sourceMappingURL=categories.service.js.map