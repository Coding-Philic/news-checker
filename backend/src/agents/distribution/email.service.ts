import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { NewsItem } from '../../common/types';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter | null = null;
  private readonly fromEmail: string;

  constructor(private readonly configService: ConfigService) {
    this.fromEmail = this.configService.get<string>('smtp.user') || '';

    try {
      this.transporter = nodemailer.createTransport({
        host: this.configService.get<string>('smtp.host'),
        port: this.configService.get<number>('smtp.port'),
        secure: false,
        family: 4, // Force IPv4 to prevent connect ENETUNREACH errors on cloud providers (Render)
        auth: {
          user: this.fromEmail,
          pass: this.configService.get<string>('smtp.pass'),
        },
      } as nodemailer.TransportOptions);
      this.logger.log('Email transporter initialized');
    } catch (error) {
      this.logger.warn(`Email transporter init failed: ${error}`);
    }
  }

  async sendNewsDigest(
    toEmail: string,
    items: NewsItem[],
    categories: string[],
  ): Promise<boolean> {
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
    } catch (error) {
      this.logger.error(`Email send error: ${error}`);
      return false;
    }
  }

  private buildHtmlEmail(items: NewsItem[], categories: string[]): string {
    const grouped = new Map<string, NewsItem[]>();
    for (const item of items) {
      const cat = item.categorySlug || 'general';
      if (!grouped.has(cat)) grouped.set(cat, []);
      grouped.get(cat)!.push(item);
    }

    const allCategories = Array.from(new Set([...categories, ...Array.from(grouped.keys())]));
    let sections = '';

    for (const category of allCategories) {
      const catItems = grouped.get(category) || [];
      if (catItems.length === 0) continue;

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
}
