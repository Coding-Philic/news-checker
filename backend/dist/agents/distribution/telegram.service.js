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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var TelegramService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TelegramService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const node_telegram_bot_api_1 = __importDefault(require("node-telegram-bot-api"));
const users_service_1 = require("../../users/users.service");
let TelegramService = TelegramService_1 = class TelegramService {
    configService;
    usersService;
    logger = new common_1.Logger(TelegramService_1.name);
    botToken;
    apiUrl;
    bot = null;
    constructor(configService, usersService) {
        this.configService = configService;
        this.usersService = usersService;
        this.botToken = this.configService.get('telegram.botToken') || '';
        this.apiUrl = this.configService.get('telegram.apiUrl') || 'https://api.telegram.org';
    }
    onModuleInit() {
        if (this.botToken) {
            try {
                this.bot = new node_telegram_bot_api_1.default(this.botToken, { polling: true });
                this.logger.log('Telegram Bot API polling started');
                this.bot.onText(/\/start (.+)/, async (msg, match) => {
                    const chatId = msg.chat.id.toString();
                    const userId = match?.[1];
                    if (userId) {
                        try {
                            await this.usersService.updateProfile(userId, { telegramChatId: chatId });
                            this.bot?.sendMessage(chatId, '✅ Success! Your Telegram account has been linked to Argus. You will now receive your daily digests here.');
                            this.logger.log(`Linked Telegram chat ${chatId} to user ${userId}`);
                        }
                        catch (error) {
                            this.logger.error(`Failed to link Telegram chat ${chatId}: ${error}`);
                            this.bot?.sendMessage(chatId, '❌ Failed to link account. Please make sure you clicked the right link from settings.');
                        }
                    }
                });
                this.bot.onText(/^\/start$/, (msg) => {
                    this.bot?.sendMessage(msg.chat.id, 'Welcome to Argus! Please click the Connect Telegram button in your Settings page to link your account.');
                });
            }
            catch (error) {
                this.logger.error(`Failed to initialize Telegram Bot: ${error}`);
            }
        }
        else {
            this.logger.warn('Telegram bot token not provided, polling disabled');
        }
    }
    async sendNewsDigest(chatId, items, categories) {
        if (!this.botToken || !chatId) {
            this.logger.warn('Telegram not configured or chatId missing');
            return false;
        }
        try {
            const grouped = this.groupByCategory(items);
            const messages = this.formatMessages(grouped, categories);
            for (const message of messages) {
                await this.sendMessage(chatId, message);
                await new Promise((resolve) => setTimeout(resolve, 200));
            }
            this.logger.log(`Telegram: sent ${messages.length} messages to chat ${chatId}`);
            return true;
        }
        catch (error) {
            this.logger.error(`Telegram send error: ${error}`);
            return false;
        }
    }
    async sendMessage(chatId, text) {
        const url = `${this.apiUrl}/bot${this.botToken}/sendMessage`;
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: chatId,
                text,
                parse_mode: 'HTML',
                disable_web_page_preview: true,
            }),
        });
        if (!response.ok) {
            const errorData = await response.text();
            this.logger.warn(`Telegram API error: ${errorData}`);
        }
    }
    groupByCategory(items) {
        const grouped = new Map();
        for (const item of items) {
            const cat = item.categorySlug || 'general';
            if (!grouped.has(cat))
                grouped.set(cat, []);
            grouped.get(cat).push(item);
        }
        return grouped;
    }
    formatMessages(grouped, categories) {
        const messages = [];
        const now = new Date().toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
        let header = `<b>Argus Daily Digest</b>\n${now}\n\n`;
        messages.push(header);
        const allCategories = Array.from(new Set([...categories, ...Array.from(grouped.keys())]));
        for (const category of allCategories) {
            const items = grouped.get(category) || [];
            if (items.length === 0)
                continue;
            const catTitle = category.charAt(0).toUpperCase() + category.slice(1);
            let msg = `<b>${catTitle}</b>\n\n`;
            for (const item of items) {
                const itemText = `<b>${item.title}</b>\n${item.summary}\n<a href="${item.sourceUrl}">Read more</a> | ${item.sourceName || item.sourcePlatform}\n\n`;
                if (msg.length + itemText.length > 3800) {
                    messages.push(msg);
                    msg = `<b>${catTitle} (continued)</b>\n\n`;
                }
                msg += itemText;
            }
            if (msg.trim().length > 0 && !msg.endsWith('(continued)</b>\n\n')) {
                messages.push(msg);
            }
        }
        return messages;
    }
};
exports.TelegramService = TelegramService;
exports.TelegramService = TelegramService = TelegramService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService,
        users_service_1.UsersService])
], TelegramService);
//# sourceMappingURL=telegram.service.js.map