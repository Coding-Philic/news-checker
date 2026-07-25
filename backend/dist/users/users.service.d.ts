import { ConfigService } from '@nestjs/config';
import { UserProfile } from '../common/types';
export declare class UsersService {
    private readonly configService;
    private readonly supabase;
    private readonly logger;
    constructor(configService: ConfigService);
    getProfile(userId: string): Promise<UserProfile | null>;
    updateProfile(userId: string, updates: {
        displayName?: string;
        timezone?: string;
        telegramChatId?: string;
        emailNotifications?: boolean;
        telegramNotifications?: boolean;
        scheduleTime?: string;
    }): Promise<UserProfile | null>;
    getInterests(userId: string): Promise<string[]>;
    updateInterests(userId: string, categorySlugs: string[]): Promise<string[]>;
    getAllUsersWithInterests(scheduleTime?: string): Promise<UserProfile[]>;
}
