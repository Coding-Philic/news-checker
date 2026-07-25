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
var DistributionAgent_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.DistributionAgent = void 0;
const common_1 = require("@nestjs/common");
const telegram_service_1 = require("./telegram.service");
const email_service_1 = require("./email.service");
let DistributionAgent = DistributionAgent_1 = class DistributionAgent {
    telegramService;
    emailService;
    logger = new common_1.Logger(DistributionAgent_1.name);
    constructor(telegramService, emailService) {
        this.telegramService = telegramService;
        this.emailService = emailService;
    }
    async distribute(user, items) {
        const result = { telegram: false, email: false };
        if (items.length === 0) {
            this.logger.log(`No items to distribute for user ${user.id}`);
            return result;
        }
        const relevantItems = items.filter((item) => !item.categorySlug || user.interests.includes(item.categorySlug));
        if (relevantItems.length === 0) {
            this.logger.log(`No relevant items for user ${user.id}`);
            return result;
        }
        if (user.telegramNotifications && user.telegramChatId) {
            result.telegram = await this.telegramService.sendNewsDigest(user.telegramChatId, relevantItems, user.interests);
        }
        if (user.emailNotifications && user.email) {
            result.email = await this.emailService.sendNewsDigest(user.email, relevantItems, user.interests);
        }
        this.logger.log(`Distribution for user ${user.id}: Telegram=${result.telegram}, Email=${result.email}`);
        return result;
    }
};
exports.DistributionAgent = DistributionAgent;
exports.DistributionAgent = DistributionAgent = DistributionAgent_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [telegram_service_1.TelegramService,
        email_service_1.EmailService])
], DistributionAgent);
//# sourceMappingURL=distribution.agent.js.map