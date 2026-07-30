import { sql } from '@vercel/postgres';

export async function initDB() {
  await sql`
    CREATE TABLE IF NOT EXISTS profiles (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      username VARCHAR(30) UNIQUE NOT NULL,
      display_name VARCHAR(50) NOT NULL,
      password_hash TEXT NOT NULL,
      bio TEXT DEFAULT '',
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS posts (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
      content TEXT NOT NULL CHECK (char_length(content) <= 280),
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS likes (
      user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
      post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      PRIMARY KEY (user_id, post_id)
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS comments (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      post_id UUID REFERENCES posts(id) ON DELETE CASCADE NOT NULL,
      user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
      content TEXT NOT NULL CHECK (char_length(content) <= 200),
      parent_id UUID REFERENCES comments(id),
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS follows (
      follower_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
      following_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      PRIMARY KEY (follower_id, following_id)
    )
  `;
}

export { sql };
