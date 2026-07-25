declare const _default: () => {
    port: number;
    nodeEnv: string;
    frontendUrl: string;
    supabase: {
        url: string | undefined;
        anonKey: string | undefined;
        serviceRoleKey: string | undefined;
    };
    groq: {
        apiKey: string | undefined;
        model: string;
    };
    newsdata: {
        apiKey: string | undefined;
        baseUrl: string;
    };
    telegram: {
        botToken: string | undefined;
        apiUrl: string;
    };
    smtp: {
        host: string;
        port: number;
        user: string | undefined;
        pass: string | undefined;
    };
    redis: {
        url: string | undefined;
        token: string | undefined;
    };
    scheduler: {
        timezone: string;
    };
};
export default _default;
