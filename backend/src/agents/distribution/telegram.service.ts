import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NewsItem } from '../../common/types';
import TelegramBot from 'node-telegram-bot-api';
import { UsersService } from '../../users/users.service';

@Injectable()
export class TelegramService implements OnModuleInit {
  private readonly logger = new Logger(TelegramService.name);
  private readonly botToken: string;
  private readonly apiUrl: string;
  private bot: TelegramBot | null = null;

  constructor(
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
  ) {
    this.botToken = this.configService.get<string>('telegram.botToken') || '';
    this.apiUrl = this.configService.get<string>('telegram.apiUrl') || 'https://api.telegram.org';
  }

  onModuleInit() {
    if (this.botToken) {
      try {
        this.bot = new TelegramBot(this.botToken, { polling: true });
        this.logger.log('Telegram Bot API polling started');

        this.bot.onText(/\/start (.+)/, async (msg: any, match: any) => {
          const chatId = msg.chat.id.toString();
          const userId = match?.[1];

          if (userId) {
            try {
              // Update user profile with chat id
              await this.usersService.updateProfile(userId, { telegramChatId: chatId });
              this.bot?.sendMessage(chatId, '✅ Success! Your Telegram account has been linked to Argus. You will now receive your daily digests here.');
              this.logger.log(`Linked Telegram chat ${chatId} to user ${userId}`);
            } catch (error) {
              this.logger.error(`Failed to link Telegram chat ${chatId}: ${error}`);
              this.bot?.sendMessage(chatId, '❌ Failed to link account. Please make sure you clicked the right link from settings.');
            }
          }
        });
        
        // Also handle normal start just in case
        this.bot.onText(/^\/start$/, (msg: any) => {
          this.bot?.sendMessage(msg.chat.id, 'Welcome to Argus! Please click the Connect Telegram button in your Settings page to link your account.');
        });
        
      } catch (error) {
        this.logger.error(`Failed to initialize Telegram Bot: ${error}`);
      }
    } else {
      this.logger.warn('Telegram bot token not provided, polling disabled');
    }
  }

  async sendNewsDigest(chatId: string, items: NewsItem[], categories: string[]): Promise<boolean> {
    if (!this.botToken || !chatId) {
      this.logger.warn('Telegram not configured or chatId missing');
      return false;
    }

    try {
      const grouped = this.groupByCategory(items);
      const messages = this.formatMessages(grouped, categories);

      for (const message of messages) {
        await this.sendMessage(chatId, message);
        // Small delay to avoid rate limits
        await new Promise((resolve) => setTimeout(resolve, 200));
      }

      this.logger.log(`Telegram: sent ${messages.length} messages to chat ${chatId}`);
      return true;
    } catch (error) {
      this.logger.error(`Telegram send error: ${error}`);
      return false;
    }
  }

  private async sendMessage(chatId: string, text: string): Promise<void> {
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

  private groupByCategory(items: NewsItem[]): Map<string, NewsItem[]> {
    const grouped = new Map<string, NewsItem[]>();
    for (const item of items) {
      const cat = item.categorySlug || 'general';
      if (!grouped.has(cat)) grouped.set(cat, []);
      grouped.get(cat)!.push(item);
    }
    return grouped;
  }

  private formatMessages(
    grouped: Map<string, NewsItem[]>,
    categories: string[],
  ): string[] {
    const messages: string[] = [];
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
      if (items.length === 0) continue;

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
}
