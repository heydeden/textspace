# TextSpace

Text-only social media — dark theme, mobile-first.

Live: [textspace-beryl.vercel.app](https://textspace-beryl.vercel.app)

## Stack

Next.js 16 + TypeScript + Tailwind CSS + Neon (Postgres) + JWT Auth

## Features

- Auth (register/login/logout with JWT httpOnly cookies)
- Text posts (280 char), create/edit (24h window)/delete
- Like/unlike, comments (nested replies 1 level), delete own comments
- Edit own posts & comments
- Hashtag render + click to search (`#tag`)
- Share/copy post link
- Follow system + notifications (like/comment/follow alerts)
- Block users (bidirectional: feed, search, trending, leaderboard, DM)
- Following feed tab
- Direct messages (chat antar user, read receipts ✓/✓✓)
- Trending feed (post populer 24 jam)
- Search users by username/display name + post content
- Role system: User / Mod / Admin + badge di profile, feed, comments
- Badge registry (admin-defined): buat badge dengan tema (20) + efek (13) → assign ke user (max 5)
- Name effect registry (admin-defined): efek nama custom (tema + animasi) → assign ke user
- Profile theme (admin-granted): banner/border/ring profil + post card author
- Reputation points & level (Newcomer → Bronze → Silver → Gold → Platinum)
- Leaderboard (top 50 by points)
- Profile stats (posts/followers/following/likes)
- Admin panel: dashboard stats, user mgmt (ban/role/points), post mgmt, reports
- Reports system (user bisa report post)
- Dark theme, mobile-first responsive

## Quick Start

```bash
npm install
npm run dev
```

Buka http://localhost:3000

## 2 Development Environments

| Folder | Port | Function |
|--------|------|----------|
| `textspace/` | :3000 | Production (Vercel) |
| `textspace-dev/` | :3001 | Development (clone utk fitur baru) |

## Project Structure

```
src/
├── app/
│   ├── page.tsx              Landing (login/register)
│   ├── (app)/                Authenticated pages
│   │   ├── feed/             Latest + Trending tabs + Following
│   │   ├── profile/[username]/
│   │   ├── post/[id]/
│   │   ├── search/
│   │   ├── notifications/
│   │   ├── messages/         + chat [userId]
│   │   ├── leaderboard/
│   │   ├── settings/
│   │   └── admin/            Dashboard, Users, Posts, Badges, Name Effects, Reports
│   └── api/                  28 API routes
├── components/               Navbar, PostCard, PostForm, CommentSection
└── lib/                      db, auth, api helpers
```

Full guide: [TEXTSPACE_GUIDE.md](../TEXTSPACE_GUIDE.md)
