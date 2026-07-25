-- Supabase Database Schema for News Checker
-- Run this in the Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- User profiles (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255),
    display_name VARCHAR(100),
    timezone VARCHAR(50) DEFAULT 'Asia/Kolkata',
    telegram_chat_id VARCHAR(50),
    email_notifications BOOLEAN DEFAULT true,
    telegram_notifications BOOLEAN DEFAULT false,
    schedule_time TIME DEFAULT '08:00:00',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- News categories
CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    slug VARCHAR(50) UNIQUE NOT NULL,
    description TEXT
);

-- User interest selections (many-to-many)
CREATE TABLE IF NOT EXISTS user_interests (
    user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
    category_id INTEGER REFERENCES categories(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, category_id)
);

-- All fetched news items
CREATE TABLE IF NOT EXISTS news_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    summary TEXT NOT NULL,
    original_title TEXT,
    source_platform VARCHAR(30) NOT NULL,
    source_name VARCHAR(100),
    source_url TEXT NOT NULL,
    category_id INTEGER REFERENCES categories(id),
    relevance_score SMALLINT DEFAULT 0,
    published_at TIMESTAMPTZ,
    fetched_at TIMESTAMPTZ DEFAULT NOW(),
    content_hash VARCHAR(64) UNIQUE
);

-- Personalized feed per user
CREATE TABLE IF NOT EXISTS user_news_feed (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
    news_item_id UUID REFERENCES news_items(id) ON DELETE CASCADE,
    delivered_via VARCHAR(20) DEFAULT 'web',
    delivered_at TIMESTAMPTZ DEFAULT NOW(),
    is_read BOOLEAN DEFAULT false
);

-- Agent run audit log
CREATE TABLE IF NOT EXISTS agent_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    run_type VARCHAR(20) NOT NULL,
    triggered_by VARCHAR(50),
    status VARCHAR(20) DEFAULT 'pending',
    categories TEXT[],
    items_found INTEGER DEFAULT 0,
    items_filtered INTEGER DEFAULT 0,
    items_delivered INTEGER DEFAULT 0,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    error_log TEXT
);

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_news_items_category ON news_items(category_id);
CREATE INDEX IF NOT EXISTS idx_news_items_fetched ON news_items(fetched_at DESC);
CREATE INDEX IF NOT EXISTS idx_news_items_hash ON news_items(content_hash);
CREATE INDEX IF NOT EXISTS idx_user_feed_user ON user_news_feed(user_id, delivered_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_feed_news ON user_news_feed(news_item_id);
CREATE INDEX IF NOT EXISTS idx_agent_runs_status ON agent_runs(status, started_at DESC);

-- Row Level Security (RLS)
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_interests ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_news_feed ENABLE ROW LEVEL SECURITY;

-- Policies: users can only read/write their own data
CREATE POLICY "Users can view own profile" ON user_profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON user_profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON user_profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can view own interests" ON user_interests
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own interests" ON user_interests
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own feed" ON user_news_feed
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own feed" ON user_news_feed
    FOR UPDATE USING (auth.uid() = user_id);

-- Public read access for categories and news items
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view categories" ON categories
    FOR SELECT TO authenticated, anon USING (true);

ALTER TABLE news_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view news items" ON news_items
    FOR SELECT TO authenticated, anon USING (true);

-- Service role bypass for server-side operations
-- (The service_role key bypasses RLS automatically in Supabase)

-- Seed default categories
INSERT INTO categories (name, slug, description) VALUES
    ('Technology', 'technology', 'Tech news, AI, software, hardware, startups'),
    ('Geopolitics', 'geopolitics', 'International relations, politics, global affairs'),
    ('Business & Finance', 'business', 'Markets, economy, companies, entrepreneurship'),
    ('Science', 'science', 'Research, discoveries, space, physics, biology'),
    ('Health', 'health', 'Medical news, wellness, public health'),
    ('Sports', 'sports', 'Sports news, scores, athletes, events'),
    ('Entertainment', 'entertainment', 'Movies, music, TV, celebrities, culture'),
    ('Environment', 'environment', 'Climate change, sustainability, nature'),
    ('Education', 'education', 'Education policy, universities, online learning'),
    ('General', 'general', 'Trending news, world events, miscellaneous')
ON CONFLICT (slug) DO NOTHING;
