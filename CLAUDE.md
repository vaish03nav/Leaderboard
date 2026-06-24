# CLAUDE.md — World Cup Betting Leaderboard ("Group Stake Tracker")

## What this app is

A private web app for a small group of friends (~5–15) to manually log bets placed on Stake during the 2026 FIFA World Cup and track performance on a shared leaderboard. It is a **tracking tool only** — it does not hold money, set odds, or interface with Stake in any way. All data is self-reported by the users.

---

## Agreed tech stack

| Layer | Choice |
|---|---|
| Frontend | React + Vite |
| Styling | Tailwind CSS |
| Backend / Database | Supabase (Postgres + auto-generated REST API) |
| Charts | Recharts |
| Football data | football-data.org (primary, free tier); API-Football as fallback |
| Hosting | Vercel |

No custom backend server. Supabase handles the database and API. All business logic (profit calculations, leaderboard rankings, balance-over-time) is computed on the client from raw event data — never stored as derived columns.

---

## Currency

**INR (₹) only.** All stakes, deposits, profit/loss, and leaderboard figures are displayed in Indian Rupees. No multi-currency support.

---

## Authentication / profiles

V1 uses **simple profile selection — no passwords, no real auth.** The landing screen lists existing profiles; users pick theirs to set the session. A "Create profile" option allows adding a name and optional avatar. This is intentional and decided — do not add auth unless explicitly asked.

---

## Milestone order

| Milestone | Scope |
|---|---|
| **M0 – Setup** | Repo created, Vite app runs locally, Supabase project initialised |
| **M1 – Data + profiles** | DB tables created; create/select profile UI works |
| **M2 – Logging** | Log a bet (live or past), log a deposit, mark bets won/lost/void |
| **M3 – Leaderboard + pending bets** | Ranked leaderboard with sort/filter; pending bets view grouped by match |
| **M4 – Profile page** | Individual bet history + balance-over-time line graph |
| **M5 – Fixtures** | API-fed fixtures and results; semi-auto settlement UI (result shown, user confirms each bet) |
| **M6 – Polish + deploy** | Final styling, Stake link, live deploy on Vercel, shared with friends |

---

## Bet settlement — V1 is manual, AI is V2

**V1 (current build):** When a match finishes, the app surfaces all pending bets for that match. The user manually clicks "Won / Lost / Void" on each bet. No AI is involved.

**V2 (future, not in initial build):** Claude API (`claude-sonnet-4-6`) reads the bet description alongside the match result and auto-determines the outcome, storing a `reasoning` field. The schema is designed now to support this drop-in:

- Every bet has a `status` field: `pending` | `won` | `lost` | `void`
- Every bet has a `reasoning` field: `null` in V1, populated by Claude in V2

Do not implement V2 AI settlement until explicitly instructed.

---

## Past bet logging

Users can log bets that were placed before the app existed. Past bets differ from live bets in the following ways:

- **Status is set at creation** — the user selects `won`, `lost`, or `void` when logging. There is no `pending` state for past bets.
- **No AI settlement** — past bets bypass the auto-settlement flow entirely.
- **Match field accepts free text** — since old fixtures will not appear in the upcoming fixtures list.
- **Date/time is editable** — defaults to today but can be set to any past date. The balance-over-time graph uses this date for correct chronological ordering.
- The "Log a bet" form has a **Live / Past toggle** that reveals the relevant fields.

Past bets are otherwise identical to settled live bets for all leaderboard and graph calculations.

---

## Key data model rules

- **Raw events only:** store deposits and bets with outcomes. Never store pre-computed totals.
- **Derived values computed on the fly:** net profit, profit %, current balance, win rate, largest win.
- **Bet linking:** live bets must link to a fixture (`match_id`); past bets may use free-text match name.
- **Permissions:** a bet owner can edit/delete their own bets. The admin profile can edit/delete any bet.

---

## Football data API

- **Primary:** football-data.org — free tier covers the World Cup, 10 req/min limit.
- **Fallback:** API-Football (api-sports.io) — 100 req/day free tier.
- Poll for match status changes (e.g. every 5 minutes during a match window). When a match reaches `FINISHED`, surface its pending bets for manual settlement confirmation.
- Build a **manual entry fallback** for fixtures in case API data is delayed or unavailable.

---

## Non-goals for V1

- No Stake API integration or auto-import of bet history.
- No real authentication or passwords.
- No multi-currency support.
- No public access — private group only.
- No AI bet settlement (V2).
