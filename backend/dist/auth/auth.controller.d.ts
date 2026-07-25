import { AuthService } from './auth.service';
declare class SignupDto {
    email: string;
    password: string;
    displayName?: string;
    emailNotifications?: boolean;
    telegramNotifications?: boolean;
}
declare class LoginDto {
    email: string;
    password: string;
}
declare class RefreshDto {
    refreshToken: string;
}
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    signup(dto: SignupDto): Promise<{
        user: import("@supabase/auth-js").User | null;
        session: import("@supabase/auth-js").Session | null;
    }>;
    login(dto: LoginDto): Promise<{
        user: import("@supabase/auth-js").User;
        session: import("@supabase/auth-js").Session;
    }>;
    refresh(dto: RefreshDto): Promise<{
        session: import("@supabase/auth-js").Session | null;
    }>;
    logout(accessToken: string): Promise<{
        message: string;
    }>;
}
export {};
