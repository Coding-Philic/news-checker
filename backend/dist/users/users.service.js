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
var UsersService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const supabase_js_1 = require("@supabase/supabase-js");
let UsersService = UsersService_1 = class UsersService {
    configService;
    supabase;
    logger = new common_1.Logger(UsersService_1.name);
    constructor(configService) {
        this.configService = configService;
        this.supabase = (0, supabase_js_1.createClient)(this.configService.get('supabase.url'), this.configService.get('supabase.serviceRoleKey'));
    }
    async getProfile(userId) {
        const { data: profile, error } = await this.supabase
            .from('user_profiles')
            .select('*')
            .eq('id', userId)
            .single();
        if (error) {
            this.logger.error(`Failed to get profile: ${error.message}`);
            return null;
        }
        const { data: interests } = await this.supabase
            .from('user_interests')
            .select('categories(slug)')
            .eq('user_id', userId);
        const interestSlugs = (interests || []).map((i) => i.categories?.slug || '').filter(Boolean);
        return {
            id: profile.id,
            displayName: profile.display_name,
            email: profile.email || '',
            timezone: profile.timezone,
            telegramChatId: profile.telegram_chat_id,
            emailNotifications: profile.email_notifications,
            telegramNotifications: profile.telegram_notifications,
            scheduleTime: profile.schedule_time,
            interests: interestSlugs,
        };
    }
    async updateProfile(userId, updates) {
        const updateData = { updated_at: new Date().toISOString() };
        if (updates.displayName !== undefined)
            updateData.display_name = updates.displayName;
        if (updates.timezone !== undefined)
            updateData.timezone = updates.timezone;
        if (updates.telegramChatId !== undefined)
            updateData.telegram_chat_id = updates.telegramChatId;
        if (updates.emailNotifications !== undefined)
            updateData.email_notifications = updates.emailNotifications;
        if (updates.telegramNotifications !== undefined)
            updateData.telegram_notifications = updates.telegramNotifications;
        if (updates.scheduleTime !== undefined)
            updateData.schedule_time = updates.scheduleTime;
        const { error } = await this.supabase
            .from('user_profiles')
            .update(updateData)
            .eq('id', userId);
        if (error) {
            this.logger.error(`Failed to update profile: ${error.message}`);
            throw new Error('Failed to update profile');
        }
        return this.getProfile(userId);
    }
    async getInterests(userId) {
        const { data, error } = await this.supabase
            .from('user_interests')
            .select('categories(slug)')
            .eq('user_id', userId);
        if (error) {
            this.logger.error(`Failed to get interests: ${error.message}`);
            return [];
        }
        return (data || []).map((i) => i.categories?.slug || '').filter(Boolean);
    }
    async updateInterests(userId, categorySlugs) {
        const { data: categories } = await this.supabase
            .from('categories')
            .select('id, slug')
            .in('slug', categorySlugs);
        if (!categories || categories.length === 0) {
            return [];
        }
        await this.supabase
            .from('user_interests')
            .delete()
            .eq('user_id', userId);
        const inserts = categories.map((cat) => ({
            user_id: userId,
            category_id: cat.id,
        }));
        const { error } = await this.supabase
            .from('user_interests')
            .insert(inserts);
        if (error) {
            this.logger.error(`Failed to update interests: ${error.message}`);
            throw new Error('Failed to update interests');
        }
        return categorySlugs;
    }
    async getAllUsersWithInterests(scheduleTime) {
        let query = this.supabase.from('user_profiles').select('*');
        if (scheduleTime) {
            query = query.eq('schedule_time', scheduleTime);
        }
        const { data: profiles, error } = await query;
        if (error || !profiles) {
            this.logger.error(`Failed to get users: ${error?.message}`);
            return [];
        }
        const users = [];
        for (const profile of profiles) {
            const { data: interests } = await this.supabase
                .from('user_interests')
                .select('categories(slug)')
                .eq('user_id', profile.id);
            const interestSlugs = (interests || []).map((i) => i.categories?.slug || '').filter(Boolean);
            if (interestSlugs.length > 0) {
                users.push({
                    id: profile.id,
                    displayName: profile.display_name,
                    email: profile.email || '',
                    timezone: profile.timezone,
                    telegramChatId: profile.telegram_chat_id,
                    emailNotifications: profile.email_notifications,
                    telegramNotifications: profile.telegram_notifications,
                    scheduleTime: profile.schedule_time,
                    interests: interestSlugs,
                });
            }
        }
        return users;
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = UsersService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], UsersService);
//# sourceMappingURL=users.service.js.map