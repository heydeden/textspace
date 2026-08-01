import { neon } from '@neondatabase/serverless';

function getDb() {
  const u = process.env.DATABASE_URL;
  if (!u) throw new Error('DATABASE_URL not set');
  return neon(u);
}

export function sql(strings: TemplateStringsArray, ...values: any[]) {
  return getDb()(strings, ...values);
}

export function query(text: string, params?: any[]) {
  return getDb()(text, params || []);
}

export async function initDB() {
  const db = getDb();
  await db`CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(30) UNIQUE NOT NULL,
    display_name VARCHAR(50) NOT NULL,
    password_hash TEXT NOT NULL,
    bio TEXT DEFAULT '',
    role VARCHAR(20) DEFAULT 'user',
    points INT DEFAULT 0,
    banned BOOLEAN DEFAULT false,
    verified BOOLEAN DEFAULT false,
    custom_roles TEXT[] DEFAULT '{}',
    name_effect VARCHAR(20) DEFAULT 'none',
    theme VARCHAR(20) DEFAULT 'default',
    created_at TIMESTAMPTZ DEFAULT NOW()
  )`;
  await db`CREATE TABLE IF NOT EXISTS posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    content TEXT NOT NULL CHECK (char_length(content) <= 280),
    created_at TIMESTAMPTZ DEFAULT NOW()
  )`;
  await db`CREATE TABLE IF NOT EXISTS likes (
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (user_id, post_id)
  )`;
  await db`CREATE TABLE IF NOT EXISTS comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID REFERENCES posts(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    content TEXT NOT NULL CHECK (char_length(content) <= 200),
    parent_id UUID REFERENCES comments(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
  )`;
  await db`CREATE TABLE IF NOT EXISTS follows (
    follower_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    following_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (follower_id, following_id)
  )`;
  await db`CREATE TABLE IF NOT EXISTS blocks (
    blocker_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    blocked_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (blocker_id, blocked_id)
  )`;
  await db`CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    actor_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    type VARCHAR(20) NOT NULL,
    post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
    read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
  )`;
  await db`CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    receiver_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    content TEXT NOT NULL CHECK (char_length(content) <= 500),
    created_at TIMESTAMPTZ DEFAULT NOW()
  )`;
  await db`CREATE TABLE IF NOT EXISTS reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reporter_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    reason TEXT NOT NULL,
    resolved BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
  )`;
  await db`CREATE TABLE IF NOT EXISTS badges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(24) UNIQUE NOT NULL,
    theme VARCHAR(30) DEFAULT 'violet',
    effect VARCHAR(30) DEFAULT 'none',
    active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
  )`;
  await db`CREATE TABLE IF NOT EXISTS user_badges (
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    badge_id UUID REFERENCES badges(id) ON DELETE CASCADE,
    granted_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (user_id, badge_id)
  )`;
  await db`ALTER TABLE messages ADD COLUMN IF NOT EXISTS read BOOLEAN DEFAULT false`;
  await db`ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'user'`;
  await db`ALTER TABLE profiles ADD COLUMN IF NOT EXISTS points INT DEFAULT 0`;
  await db`ALTER TABLE profiles ADD COLUMN IF NOT EXISTS banned BOOLEAN DEFAULT false`;
  await db`ALTER TABLE profiles ADD COLUMN IF NOT EXISTS verified BOOLEAN DEFAULT false`;
  await db`ALTER TABLE profiles ADD COLUMN IF NOT EXISTS custom_roles TEXT[] DEFAULT '{}'`;
  await db`ALTER TABLE profiles ADD COLUMN IF NOT EXISTS name_effect VARCHAR(20) DEFAULT 'none'`;
  await db`ALTER TABLE profiles ADD COLUMN IF NOT EXISTS theme VARCHAR(20) DEFAULT 'default'`;
  await db`ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_style VARCHAR(30) DEFAULT NULL`;
  await db`ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_seed VARCHAR(50) DEFAULT NULL`;
  await db`ALTER TABLE notifications ADD COLUMN IF NOT EXISTS reference_id UUID DEFAULT NULL`;
  await db`CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, created_at DESC)`;
  await db`CREATE INDEX IF NOT EXISTS idx_messages_users ON messages(sender_id, receiver_id)`;
  await db`CREATE INDEX IF NOT EXISTS idx_reports_resolved ON reports(resolved)`;
}
