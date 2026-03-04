# CodeConnect

A social network for LeetCode users — track progress, connect with friends, post coding doubts, and chat privately.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15 (App Router, TypeScript, Tailwind CSS) |
| Backend | Supabase (PostgreSQL + Auth + Realtime) |
| LeetCode | Public GraphQL API |
| Deployment | Vercel |
| Chat Encryption | CryptoJS (AES) |

## Getting Started

### 1. Clone & Install

```bash
cd Projects/codeconnect
npm install
```

### 2. Set up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run the full schema: `supabase/schema.sql`
3. Enable **Realtime** for the `messages`, `conversations`, and `friend_requests` tables

### 3. Configure Environment Variables

Copy `.env.example` to `.env.local` and fill in:

```bash
cp .env.example .env.local
```

| Variable | Where to find it |
|----------|-----------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Settings → API → anon public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Settings → API → service_role key |
| `NEXT_PUBLIC_CHAT_ENCRYPTION_KEY` | Generate any long random string |

### 4. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Features

### Authentication
- Email/password signup and login via Supabase Auth
- Username chosen at signup, auto-lowercase alphanumeric
- User profile auto-created on first signup (DB trigger)
- JWT-based sessions with cookie persistence

### LeetCode Integration
- Enter your LeetCode username in Profile to link account
- Stats auto-fetched from public LeetCode GraphQL API:
  - Easy / Medium / Hard solved counts
  - Global ranking, acceptance rate, contribution points
- Stats cached in DB, can be manually refreshed
- Auto-refreshes every 24 hours via `next: { revalidate: 86400 }`

### Friends System
- Search users by username
- Send / accept / decline friend requests
- Real-time request notifications (Supabase Realtime)
- Remove friends at any time
- Only friends can message each other (enforced by RLS)

### Real-Time Chat
- Private 1:1 conversations between friends only
- Real-time message delivery via Supabase Realtime subscriptions
- **End-to-end encryption** with AES (CryptoJS)
- Message status: sent → delivered → read
- Persistent conversation history

### Doubt Feed
- Post coding doubts with title, description, optional LeetCode problem link
- Tag posts with topics (dp, graphs, bfs, etc.)
- Like posts (optimistic UI updates)
- Comment threads on each post

### Progress Tracking
- Visual progress bars per difficulty
- Summary stats cards
- Linked to live LeetCode data

## Project Structure

```
src/
├── app/
│   ├── (authenticated)/   # Authenticated app routes
│   │   ├── dashboard/      # Home dashboard
│   │   ├── feed/           # Doubt posts + [id]/ detail
│   │   ├── friends/        # Friends management
│   │   ├── chat/           # Real-time messaging
│   │   ├── progress/       # LeetCode stats
│   │   └── profile/        # User profile + LeetCode link
│   ├── auth/               # Login, signup, callback
│   └── layout.tsx          # Root layout
├── components/
│   └── Sidebar.tsx         # Navigation sidebar
├── lib/
│   ├── supabase/           # Client, server, middleware
│   ├── leetcode.ts         # LeetCode GraphQL integration
│   ├── encryption.ts       # AES message encryption
│   └── utils.ts            # Helpers
├── types/
│   └── index.ts            # TypeScript interfaces
└── middleware.ts            # Auth routing middleware
supabase/
└── schema.sql              # Full DB schema with RLS
```

## Security

- Row Level Security (RLS) on all tables
- Users can only read/write their own data
- Messages only accessible to conversation participants
- Only friends can start conversations (enforced in DB)
- All chat messages encrypted with AES before storage
- Rate limiting on posts (add Supabase Edge Functions for production)
- Input validation on all forms

## Deployment

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Set env vars
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel env add SUPABASE_SERVICE_ROLE_KEY
vercel env add NEXT_PUBLIC_CHAT_ENCRYPTION_KEY
```

## Future Enhancements

- [ ] Competitive coding rooms
- [ ] Global leaderboards
- [ ] Weekly coding battles
- [ ] AI-based doubt solving assistant
- [ ] Resume generator from LeetCode stats
- [ ] Mobile app (React Native)
- [ ] Email notifications for friend requests and replies
