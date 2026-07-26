"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var EmailService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const nodemailer = __importStar(require("nodemailer"));
let EmailService = EmailService_1 = class EmailService {
    configService;
    logger = new common_1.Logger(EmailService_1.name);
    transporter = null;
    fromEmail;
    constructor(configService) {
        this.configService = configService;
        this.fromEmail = this.configService.get('smtp.user') || '';
        try {
            this.transporter = nodemailer.createTransport({
                host: this.configService.get('smtp.host'),
                port: this.configService.get('smtp.port'),
                secure: false,
                family: 4,
                auth: {
                    user: this.fromEmail,
                    pass: this.configService.get('smtp.pass'),
                },
            });
            this.logger.log('Email transporter initialized');
        }
        catch (error) {
            this.logger.warn(`Email transporter init failed: ${error}`);
        }
    }
    async sendNewsDigest(toEmail, items, categories) {
        if (!this.transporter || !toEmail) {
            this.logger.warn('Email not configured or recipient missing');
            return false;
        }
        try {
            const html = this.buildHtmlEmail(items, categories);
            const now = new Date().toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
            });
            await this.transporter.sendMail({
                from: `"Argus" <${this.fromEmail}>`,
                to: toEmail,
                subject: `Your News Digest - ${now}`,
                html,
            });
            this.logger.log(`Email sent to ${toEmail}`);
            return true;
        }
        catch (error) {
            this.logger.error(`Email send error: ${error}`);
            return false;
        }
    }
    buildHtmlEmail(items, categories) {
        const grouped = new Map();
        for (const item of items) {
            const cat = item.categorySlug || 'general';
            if (!grouped.has(cat))
                grouped.set(cat, []);
            grouped.get(cat).push(item);
        }
        const allCategories = Array.from(new Set([...categories, ...Array.from(grouped.keys())]));
        let sections = '';
        for (const category of allCategories) {
            const catItems = grouped.get(category) || [];
            if (catItems.length === 0)
                continue;
            sections += `
        <tr>
          <td style="padding: 24px 0 12px 0;">
            <h2 style="margin: 0; font-size: 18px; color: #4F6EF7; text-transform: uppercase; letter-spacing: 1px;">
              ${category}
            </h2>
          </td>
        </tr>`;
            for (const item of catItems) {
                sections += `
        <tr>
          <td style="padding: 12px 16px; background: #1A1A26; border-radius: 8px; margin-bottom: 8px;">
            <h3 style="margin: 0 0 8px 0; font-size: 16px; color: #E8E8ED;">
              <a href="${item.sourceUrl}" style="color: #E8E8ED; text-decoration: none;">${item.title}</a>
            </h3>
            <p style="margin: 0 0 8px 0; font-size: 14px; color: #8B8B9E; line-height: 1.5;">
              ${item.summary}
            </p>
            <p style="margin: 0; font-size: 12px; color: #5C5C72;">
              ${item.sourceName || item.sourcePlatform}
            </p>
          </td>
        </tr>
        <tr><td style="height: 8px;"></td></tr>`;
            }
        }
        return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin: 0; padding: 0; background: #0A0A0F; font-family: 'Inter', Arial, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background: #0A0A0F;">
    <tr>
      <td align="center" style="padding: 32px 16px;">
        <table width="600" cellpadding="0" cellspacing="0" style="background: #12121A; border-radius: 12px; overflow: hidden;">
          <tr>
            <td style="padding: 32px 24px; text-align: center;">
              <h1 style="margin: 0; font-size: 24px; color: #E8E8ED; font-weight: 700;">Argus</h1>
              <p style="margin: 8px 0 0 0; font-size: 14px; color: #8B8B9E;">Your daily news digest</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 0 24px 32px 24px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                ${sections}
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding: 16px 24px; text-align: center; border-top: 1px solid #1E1E2E;">
              <p style="margin: 0; font-size: 12px; color: #5C5C72;">
                Argus - Your personalized news aggregator
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
    }
};
exports.EmailService = EmailService;
exports.EmailService = EmailService = EmailService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], EmailService);
//# sourceMappingURL=email.service.js.map