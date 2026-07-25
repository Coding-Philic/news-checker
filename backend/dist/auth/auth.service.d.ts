import { ConfigService } from '@nestjs/config';
import { SupabaseClient } from '@supabase/supabase-js';
export declare class AuthService {
    private readonly configService;
    private readonly supabase;
    private readonly supabaseAdmin;
    private readonly logger;
    constructor(configService: ConfigService);
    signup(email: string, password: string, displayName?: string, notifications?: {
        emailNotifications?: boolean;
        telegramNotifications?: boolean;
    }): Promise<{
        user: import("@supabase/supabase-js").AuthUser | null;
        session: import("@supabase/supabase-js").AuthSession | null;
    }>;
    login(email: string, password: string): Promise<{
        user: import("@supabase/supabase-js").AuthUser;
        session: import("@supabase/supabase-js").AuthSession;
    }>;
    refreshToken(refreshToken: string): Promise<{
        session: import("@supabase/supabase-js").AuthSession | null;
    }>;
    logout(accessToken: string): Promise<{
        message: string;
    }>;
    verifyToken(token: string): Promise<import("@supabase/supabase-js").AuthUser>;
    getAdminClient(): SupabaseClient;
}
