# Konekto

## Supabase setup

1. Create a Supabase project.
2. Open the Supabase SQL editor and run `supabase/schema.sql`.
3. Copy `.env.example` to `.env.local`.
4. Fill in `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` from Project Settings > API.
5. Start the app with `npm run dev`.

The app reads circles, events, deals, jobs, and Japan Life guides from Supabase when those environment variables are present. Add buttons on those pages insert new rows into the matching Supabase table.

If Supabase is not configured, or if a query fails in development, the app falls back to the local mock data in `src/data/mock.ts`. Inserts require Supabase to be configured and the insert policies from `supabase/schema.sql` to be applied.
