# Daff × FIFA WC — Group Stake Tracker

A private web app for a small group of friends to log bets placed on Stake
during the 2026 FIFA World Cup and track performance on a shared leaderboard.
It's a **tracking tool only** — it holds no money and sets no odds. All data is
self-reported.

## Stack

- **Frontend:** React + Vite, Tailwind CSS v4
- **Backend / DB:** Supabase (Postgres + auto REST API + Edge Functions)
- **Charts:** Recharts
- **Football data:** football-data.org (via a Supabase Edge Function)
- **Hosting:** Vercel
- **Currency:** INR (₹) only

## Local development

```bash
npm install
cp .env.example .env   # then fill in your Supabase values
npm run dev            # http://localhost:5173
```

### Environment variables

| Variable | Where | Notes |
|---|---|---|
| `VITE_SUPABASE_URL` | `.env` (and Vercel) | Project URL — safe to expose |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | `.env` (and Vercel) | Publishable key — safe to expose |
| `FOOTBALL_DATA_TOKEN` | Supabase Edge Function **secret** | Server-side only; never in the frontend |

The `FOOTBALL_DATA_TOKEN` powers the `sync-fixtures` Edge Function (fixtures &
results). Set it in the Supabase dashboard → Edge Functions → Secrets, or:

```bash
npx supabase secrets set FOOTBALL_DATA_TOKEN=<token> --project-ref <project-ref>
```

## Deploy to Vercel

Vercel auto-detects Vite (build: `npm run build`, output: `dist`). From the
project directory:

```bash
npx vercel            # first run: log in + link the project
npx vercel --prod     # production deploy
```

Then add the two `VITE_*` env vars in **Vercel → Project → Settings →
Environment Variables** and redeploy.

## Build

```bash
npm run build         # production build into dist/
npm run preview       # preview the production build locally
npm run lint          # oxlint
```
