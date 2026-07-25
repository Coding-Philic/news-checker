import { NewsItem, UserProfile } from '../../common/types';
import { TelegramService } from './telegram.service';
import { EmailService } from './email.service';
export declare class DistributionAgent {
    private readonly telegramService;
    private readonly emailService;
    private readonly logger;
    constructor(telegramService: TelegramService, emailService: EmailService);
    distribute(user: UserProfile, items: NewsItem[]): Promise<{
        telegram: boolean;
        email: boolean;
    }>;
}
