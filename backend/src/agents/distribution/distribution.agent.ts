import { Injectable, Logger } from '@nestjs/common';
import { NewsItem, UserProfile } from '../../common/types';
import { TelegramService } from './telegram.service';
import { EmailService } from './email.service';

@Injectable()
export class DistributionAgent {
  private readonly logger = new Logger(DistributionAgent.name);

  constructor(
    private readonly telegramService: TelegramService,
    private readonly emailService: EmailService,
  ) {}

  async distribute(
    user: UserProfile,
    items: NewsItem[],
  ): Promise<{ telegram: boolean; email: boolean }> {
    const result = { telegram: false, email: false };

    if (items.length === 0) {
      this.logger.log(`No items to distribute for user ${user.id}`);
      return result;
    }

    // Filter items to only include user's interested categories
    const relevantItems = items.filter(
      (item) =>
        !item.categorySlug || user.interests.includes(item.categorySlug),
    );

    if (relevantItems.length === 0) {
      this.logger.log(`No relevant items for user ${user.id}`);
      return result;
    }

    // Send via Telegram
    if (user.telegramNotifications && user.telegramChatId) {
      result.telegram = await this.telegramService.sendNewsDigest(
        user.telegramChatId,
        relevantItems,
        user.interests,
      );
    }

    // Send via Email
    if (user.emailNotifications && user.email) {
      result.email = await this.emailService.sendNewsDigest(
        user.email,
        relevantItems,
        user.interests,
      );
    }

    this.logger.log(
      `Distribution for user ${user.id}: Telegram=${result.telegram}, Email=${result.email}`,
    );

    return result;
  }
}
