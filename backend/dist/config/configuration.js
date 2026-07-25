"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = () => ({
    port: parseInt(process.env.PORT || '3001', 10),
    nodeEnv: process.env.NODE_ENV || 'development',
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
    supabase: {
        url: process.env.SUPABASE_URL,
        anonKey: process.env.SUPABASE_ANON_KEY,
        serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
    },
    groq: {
        apiKey: process.env.GROQ_API_KEY,
        model: process.env.GROQ_MODEL || 'openai/gpt-oss-20b',
    },
    newsdata: {
        apiKey: process.env.NEWSDATA_API_KEY,
        baseUrl: 'https://newsdata.io/api/1',
    },
    telegram: {
        botToken: process.env.TELEGRAM_BOT_TOKEN,
        apiUrl: 'https://api.telegram.org',
    },
    smtp: {
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT || '587', 10),
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
    redis: {
        url: process.env.UPSTASH_REDIS_URL,
        token: process.env.UPSTASH_REDIS_TOKEN,
    },
    scheduler: {
        timezone: process.env.CRON_TIMEZONE || 'Asia/Kolkata',
    },
});
//# sourceMappingURL=configuration.js.map