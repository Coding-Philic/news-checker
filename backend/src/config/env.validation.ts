import * as Joi from 'joi';

export const envValidationSchema = Joi.object({
  PORT: Joi.number().default(3001),
  NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
  FRONTEND_URL: Joi.string().default('http://localhost:5173'),

  SUPABASE_URL: Joi.string().required(),
  SUPABASE_ANON_KEY: Joi.string().required(),
  SUPABASE_SERVICE_ROLE_KEY: Joi.string().required(),

  GROQ_API_KEY: Joi.string().required(),
  NEWSDATA_API_KEY: Joi.string().default(''),

  // Optional services — app works without these
  TELEGRAM_BOT_TOKEN: Joi.string().allow('').default(''),

  SMTP_HOST: Joi.string().default('smtp.gmail.com'),
  SMTP_PORT: Joi.number().default(587),
  SMTP_USER: Joi.string().allow('').default(''),
  SMTP_PASS: Joi.string().allow('').default(''),

  UPSTASH_REDIS_URL: Joi.string().allow('').default(''),
  UPSTASH_REDIS_TOKEN: Joi.string().allow('').default(''),

  CRON_TIMEZONE: Joi.string().default('Asia/Kolkata'),
}).unknown(true);
