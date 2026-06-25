# Operations Command Centre — Shining Overseas

Internal lead pipeline CRM. Next.js 15 + TypeScript + Tailwind + Supabase.

## Quick start

1. `cp .env.local.example .env.local` and fill in your Supabase + session values
2. `npm install`
3. Run Supabase SQL migrations in order: `supabase/001_auth_schema.sql` then `supabase/002_leads_schema.sql`
4. `npm run dev`

## Deploy to Vercel

1. Push repo to GitHub
2. Import repo in Vercel
3. Add environment variables (from `.env.local.example`) in Vercel project settings
4. Deploy

## Demo accounts (after running migrations)
- Admin: `shiningair47@gmail.com` / `@Arik9999`
- Setter: `priya.shah@shiningoverseas.local` / `Setter@2025`
- Closer: `rohan.kapoor@shiningoverseas.local` / `Closer@2025`
