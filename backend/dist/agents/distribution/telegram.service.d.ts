import { OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NewsItem } from '../../common/types';
import { UsersService } from '../../users/users.service';
export declare class TelegramService implements OnModuleInit {
    private readonly configService;
    private readonly usersService;
    private readonly logger;
    private readonly botToken;
    private readonly apiUrl;
    private bot;
    constructor(configService: ConfigService, usersService: UsersService);
    onModuleInit(): void;
    sendNewsDigest(chatId: string, items: NewsItem[], categories: string[]): Promise<boolean>;
    private sendMessage;
    private groupByCategory;
    private formatMessages;
}
