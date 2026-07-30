# TextSpace

Text-only social media — dark theme, mobile-first.

Live: [textspace-beryl.vercel.app](https://textspace-beryl.vercel.app)

## Stack

Next.js 16 + TypeScript + Tailwind CSS + Neon (Postgres) + JWT Auth

## Features

- Auth (register/login/logout with JWT httpOnly cookies)
- Text posts (280 char), create/delete
- Like/unlike, comment, bookmark, repost
- Follow system + notifications (like/comment/follow alerts)
- Direct messages (chat antar user)
- Trending feed (post populer 24 jam)
- Search users by username/display name
- Role system: User / Mod / Admin + badge di profile, feed, comments
- Reputation points & level (Newcomer → Bronze → Silver → Gold → Platinum)
- Admin panel: dashboard stats, user mgmt (ban/role), post mgmt, reports
- Reports system (user bisa report post)
- Dark theme, mobile-first responsive

## Quick Start

```bash
npm install
npm run dev
```

Buka http://localhost:3000

## 3 Development Environments

| Folder | Port | Function |
|--------|------|----------|
| `textspace/` | :3000 | Production (Vercel) |
| `textspace-dev/` | :3001 | Development |
| `textspace-test/` | :3002 | Testing |

## Project Structure

```
src/
├── app/
│   ├── page.tsx              Landing (login/register)
│   ├── (app)/                Authenticated pages
│   │   ├── feed/             Latest + Trending tabs
│   │   ├── profile/[username]/
│   │   ├── post/[id]/
│   │   ├── search/
│   │   ├── notifications/
│   │   ├── messages/         + chat [userId]
│   │   ├── bookmarks/
│   │   ├── settings/
│   │   └── admin/            Dashboard, Users, Posts, Reports
│   └── api/                  25 API routes
├── components/               Navbar, PostCard, PostForm, CommentSection
└── lib/                      db, auth, api helpers
```

Full guide: [TEXTSPACE_GUIDE.md](../TEXTSPACE_GUIDE.md)
