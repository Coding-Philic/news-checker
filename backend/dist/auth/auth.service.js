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
var AuthService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const supabase_js_1 = require("@supabase/supabase-js");
let AuthService = AuthService_1 = class AuthService {
    configService;
    supabase;
    supabaseAdmin;
    logger = new common_1.Logger(AuthService_1.name);
    constructor(configService) {
        this.configService = configService;
        this.supabase = (0, supabase_js_1.createClient)(this.configService.get('supabase.url'), this.configService.get('supabase.anonKey'));
        this.supabaseAdmin = (0, supabase_js_1.createClient)(this.configService.get('supabase.url'), this.configService.get('supabase.serviceRoleKey'));
        console.log('INIT AUTH SERVICE WITH SUPABASE URL:', this.configService.get('supabase.url'));
    }
    async signup(email, password, displayName, notifications) {
        const { data, error } = await this.supabase.auth.signUp({
            email,
            password,
            options: {
                data: { display_name: displayName },
            },
        });
        if (error) {
            this.logger.error(`Signup failed: ${error.message}`);
            throw new common_1.UnauthorizedException(error.message);
        }
        if (data.user) {
            await this.supabaseAdmin.from('user_profiles').upsert({
                id: data.user.id,
                email: email,
                display_name: displayName || email.split('@')[0],
                timezone: 'Asia/Kolkata',
                email_notifications: notifications?.emailNotifications ?? true,
                telegram_notifications: notifications?.telegramNotifications ?? false,
                schedule_time: '08:00:00',
            });
        }
        return {
            user: data.user,
            session: data.session,
        };
    }
    async login(email, password) {
        const { data, error } = await this.supabase.auth.signInWithPassword({
            email,
            password,
        });
        if (error) {
            this.logger.error(`Login failed: ${error.message}`);
            throw new common_1.UnauthorizedException('Invalid email or password');
        }
        return {
            user: data.user,
            session: data.session,
        };
    }
    async refreshToken(refreshToken) {
        const { data, error } = await this.supabase.auth.refreshSession({
            refresh_token: refreshToken,
        });
        if (error) {
            throw new common_1.UnauthorizedException('Invalid refresh token');
        }
        return {
            session: data.session,
        };
    }
    async logout(accessToken) {
        const { error } = await this.supabase.auth.admin.signOut(accessToken);
        if (error) {
            this.logger.warn(`Logout warning: ${error.message}`);
        }
        return { message: 'Logged out successfully' };
    }
    async verifyToken(token) {
        const { data, error } = await this.supabase.auth.getUser(token);
        if (error || !data.user) {
            throw new common_1.UnauthorizedException('Invalid or expired token');
        }
        return data.user;
    }
    getAdminClient() {
        return this.supabaseAdmin;
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = AuthService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], AuthService);
//# sourceMappingURL=auth.service.js.map