import { UsersService } from './users.service';
declare class UpdateProfileDto {
    displayName?: string;
    timezone?: string;
    telegramChatId?: string;
    emailNotifications?: boolean;
    telegramNotifications?: boolean;
    scheduleTime?: string;
}
declare class UpdateInterestsDto {
    categories: string[];
}
export declare class UsersController {
    private readonly usersService;
    constructor(usersService: UsersService);
    getProfile(userId: string): Promise<import("../common/types").UserProfile | null>;
    updateProfile(userId: string, dto: UpdateProfileDto): Promise<import("../common/types").UserProfile | null>;
    getInterests(userId: string): Promise<string[]>;
    updateInterests(userId: string, dto: UpdateInterestsDto): Promise<string[]>;
}
export {};
