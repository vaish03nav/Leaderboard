# Product Requirements Document (PRD)
## World Cup Betting Leaderboard — "Group Stake Tracker"

**Author:** [Your name]
**Date:** June 2026
**Status:** Draft v1 (MVP scope)

---

## 1. Summary

A private web app for a small group of friends to log the bets they place (on Stake) during the 2026 FIFA World Cup, see a shared leaderboard ranked by various metrics, view World Cup fixtures and results, and track each person's money in and money in hand over time.

This is a **personal-use tracking tool**, not a gambling platform. It does not take bets, hold money, or set odds. It records bets that have already been placed elsewhere.

---

## 2. Goals & Non-Goals

### Goals
- Let a known group of friends each have a profile.
- Let each person log a bet (match, the bet itself, stake amount, multiplier/odds, outcome).
- Show a leaderboard sortable/filterable by profit %, profit amount, largest bet won, etc.
- Track how much money each person has put in ("deposits") vs. what they have now.
- Show World Cup fixtures & results.
- Show each person's bet history and a "balance over time" graph.
- Provide a quick link out to Stake.

### Non-Goals (for v1)
- ❌ Automatically scraping/importing bet data from Stake (see Risks).
- ❌ Real authentication/passwords (v1 can use simple profile selection — see Open Questions).
- ❌ Handling real money or payouts.
- ❌ Being public / supporting unlimited users.

---

## 3. Target Users

A closed group of ~5–15 friends who already bet on Stake and trust each other to log honestly. One person (you) is the admin/maintainer.

---

## 4. Key Concepts (Data Model)

These are the core "things" the app stores. Everything on screen is **derived** from these.

| Entity | Fields (core) |
|---|---|
| **Profile** | id, display_name, avatar (optional), created_at |
| **Deposit** | id, profile_id, amount, note, created_at — money put into the game |
| **Bet** | id, profile_id, match_id (or text), bet_description, stake_amount, multiplier (odds), status (`pending` / `won` / `lost` / `void`), placed_at, settled_at |
| **Match / Fixture** | id, home_team, away_team, kickoff_time, status, home_score, away_score (from a football data API, or entered manually) |

**Derived values (never stored as the source of truth, always computed):**
- Potential payout = stake_amount × multiplier
- Actual return = potential payout if won, 0 if lost, stake refunded if void
- Net profit = total returns − total stakes
- Profit % = net profit ÷ total deposited
- Current balance / "money in hand" = total deposited + net profit
- Largest bet won = max actual return among won bets

> **Design principle:** store raw *events* (deposits + bets with outcomes). Compute totals, rankings, and graphs on the fly. This keeps the data correct and makes new metrics easy to add later.

---

## 5. Features & Requirements

### 5.1 Profile selection / creation
- **Decision for v1: simple profile selection — no passwords/logins.** Suitable for a trusted friend group; revisit only if the group grows or trust becomes an issue.
- Landing screen shows existing profiles as a list/grid.
- "Create new profile" if yours isn't there (name + optional avatar).
- Selecting a profile sets the "current user" for the session.

### 5.2 Leaderboard (main screen)
- One row per profile with key stats: net profit, profit %, total staked, total deposited, largest win, win rate.
- **Filter/sort controls:** profit %, profit amount, largest bet won, total wagered, win rate.
- Visual emphasis on top 3.
- Each person's "money put in" (total deposits) is visible.

### 5.3 Log a bet
- Form: select match (from fixtures list), enter bet description, multiplier/odds, stake amount.
- Status starts as `pending`.
- Later, mark the bet `won` / `lost` / `void` (this is what updates the leaderboard).
- Optional: log a deposit (money added to the Stake account).

### 5.4 Fixtures & results
- List of World Cup matches with dates, teams, and scores once played.
- Source: a football-data API (e.g. football-data.org or API-Football). If the API doesn't cover this tournament on the free tier, allow manual entry as a fallback.

### 5.5 Profile page
- All of that person's bets (filterable by status).
- "Balance over time" line graph: running balance computed chronologically from deposits + settled bets.
- Summary stats (same metrics as leaderboard, just for one person).

### 5.6 Link to Stake
- A clearly labelled button/link that opens Stake in a new tab.

### 5.7 Pending bets view (core feature)
- A dedicated screen listing **everyone's open (`pending`) bets**, grouped by upcoming match.
- For each pending bet, show: who placed it, the match, the bet description, stake, multiplier, and potential payout.
- Default sort by match kickoff time (soonest first) so it doubles as a "what to watch / what's at stake" board.
- Once a match finishes, its pending bets surface for settling (mark won/lost/void).
- Purpose: builds anticipation before matches and acts as the natural prompt to settle bets afterwards.

---

## 6. Suggested Additional Features

**High value, low effort**
- **"Settle bet" reminders** — when a match finishes, flag bets on it as needing a result.
- **Head-to-head / streaks** — current win/loss streak per person; biggest single-day gain.
- **Activity feed** — "Alex logged a 4.5x bet on Brazil to win" — makes it feel alive.

> Note: the **Pending bets view** was promoted from this list to a core feature (see 5.7).

**Medium effort**
- **Per-match betting view** — click a fixture, see everyone who bet on it and how they did.
- **Filters by date range / by tournament stage** (group stage vs knockouts).
- **CSV export** of all bets (useful for backups and for settling up money later).
- **Light/dark theme.**

**Nice-to-have / stretch**
- **Group pot / settle-up calculator** — who owes whom at the end.
- **Predictions vs. results** — optional pre-match predictions, scored separately from real bets.
- **Notifications** (email/push) when someone overtakes you on the leaderboard.

**Responsible-use features (genuinely useful, not just a disclaimer)**
- **Spend awareness:** since you're already tracking deposits, surface a simple "total put in this tournament" per person and a group total. An optional self-set "limit" with a gentle visual cue is a small feature that makes the tool more honest and is a good portfolio talking point.

---

## 7. Out of Scope / Risks & Constraints

- **Stake auto-import:** No supported public API for personal bet history; scraping authenticated pages is brittle and likely violates Stake's ToS. **Manual logging is the v1 mechanism.** Revisit only if Stake exposes an official API.
- **Trust model:** v1 relies on honest self-reporting. Fine for friends; not robust against cheating.
- **Legal/age:** betting and the tools around it are age-restricted and regulated differently by region. This tool should be used only where the underlying activity is legal for the people using it.
- **API limits:** free football-data API tiers have rate limits and may lag on a brand-new tournament; build a manual fallback.

---

## 8. Suggested Tech Stack (beginner-friendly)

- **Frontend:** React (created with Vite) + a styling option (Tailwind CSS or plain CSS).
- **Backend + Database + Auth:** Supabase (gives you a Postgres database, simple auth, and an auto-generated API — so you write almost no server code).
- **Charts:** Recharts or Chart.js.
- **Football data:** football-data.org or API-Football (free tier), with manual entry fallback.
- **Hosting:** Vercel or Netlify (free, one-click deploy from GitHub).

---

## 9. Milestones (suggested build order)

1. **M0 – Setup:** repo, React app runs locally, Supabase project created.
2. **M1 – Data + profiles:** tables created; create/select profile works.
3. **M2 – Logging:** log a bet, log a deposit, mark bets won/lost.
4. **M3 – Leaderboard + pending bets:** compute and display ranked stats with filters; build the pending-bets view (open bets grouped by match).
5. **M4 – Profile page:** bet history + balance-over-time graph.
6. **M5 – Fixtures:** pull fixtures/results from API (or manual entry).
7. **M6 – Polish + deploy:** styling, Stake link, deploy live, share with friends.

---

## 10. Open Questions

- ~~Do you need real logins?~~ **Decided: simple profile selection, no passwords (v1).**
- One shared currency, or do people bet in different currencies/crypto?
- Should bet outcomes be auto-settled from match results, or always confirmed manually?
- Who is allowed to edit/delete a bet — only the owner, or you as admin too?

---

## 11. Resolved Decisions (formerly Open Questions)

- ~~Do you need real logins?~~ **Decided: simple profile selection, no passwords (v1).**
- ~~Currency?~~ **Decided: INR (₹) only. All stakes, deposits, and profit/loss displayed in ₹.**
- ~~Auto-settle or manual?~~ **Decided: auto-settle bets based on match results from the fixtures API. When a match result is confirmed, pending bets on that match are resolved automatically. A manual override remains available in case of API delay or error.**
- ~~Who can edit/delete?~~ **Decided: the bet owner can edit/delete their own bets. The admin profile can edit/delete any bet.**

---

## 12. Football Data API

**Primary: football-data.org (free tier)**
- Includes the World Cup in its free competition tier permanently.
- Rate limit: 10 requests/minute — sufficient for a small private app.
- Provides: fixtures, match results, standings, group tables.
- Sign up at football-data.org for a free API key.
- Use this for: populating the fixtures screen, detecting when a match is finished (triggers auto-settle).

**Backup: API-Football (api-sports.io)**
- Free tier: 100 requests/day.
- Slightly more generous on live match data.
- Use as a fallback if football-data.org is delayed on a result.

**How auto-settle will work (using the API):**
1. App polls the fixtures API periodically (e.g. every 5 minutes during a match window).
2. When a match status changes to "FINISHED" and scores are confirmed, the app checks if any pending bets are linked to that match.
3. The bet description is compared to the result (e.g. "Brazil to win" → Brazil won → bet is marked `won`; lost → `lost`).
4. Because the app cannot automatically *interpret* free-text bet descriptions, step 3 will require a simple manual confirmation UI: the match result is shown alongside each pending bet, and the user clicks ✓ Won / ✗ Lost. This is "semi-auto" — the result is fetched automatically, the user just confirms each bet individually.
5. Admin can override any settlement at any time.

---

## 13. AI-Powered Bet Auto-Settlement (V2 — Not in initial build)

**V1 behaviour (current build):** When a match finishes, the app surfaces pending bets for that match and the user manually marks each one as won / lost / void. Simple, no API cost, no complexity.

**V2 plan (future):** Replace the manual step with Claude AI reading the bet description alongside the match result and automatically determining the outcome. Design the bet data model now so V2 can be dropped in without a schema change — specifically, ensure every bet has a `status` field (`pending` / `won` / `lost` / `void`) and a `reasoning` field (null in V1, populated by Claude in V2).

**How it works:**
1. The app polls football-data.org periodically. When a match status changes to `FINISHED`, the final score and result are fetched.
2. The app finds all pending bets linked to that match.
3. For each bet, the app sends a prompt to the Claude API (claude-sonnet-4-6) containing:
   - The bet description (e.g. "Brazil to win", "Over 2.5 goals", "Messi to score anytime")
   - The match result (e.g. "Brazil 3 – 1 Argentina, scorers: Messi 45', Vinicius 67', 78', 89'")
4. Claude returns a structured JSON response: `{ "result": "won" | "lost" | "void", "reasoning": "..." }`
5. The app updates the bet status in Supabase automatically.
6. The reasoning is stored and visible to the user so they can see why Claude made the call.

**Admin override:** If Claude gets it wrong (ambiguous bet, unusual phrasing), the admin can still manually correct any settled bet.

**What Claude can handle:**
- Match result bets ("Brazil to win", "Draw", "Argentina not to lose")
- Goals bets ("Over 2.5 goals", "Both teams to score", "Clean sheet for France")
- Scorers ("Messi to score", "Ronaldo anytime scorer")
- Margin bets ("Brazil to win by more than 1")
- Half-time/full-time ("Brazil winning at half time")

**What it cannot handle:** Bets that require data the match result doesn't include (e.g. exact minute of first goal unless scorer data includes it, or corner counts). These will be flagged as `needs_review` rather than guessed.

**API used:** Anthropic Claude API (claude-sonnet-4-6) via the `/v1/messages` endpoint. This is the same model powering this chat — callable directly from the app's backend logic.

---

## 14. Past Bet Logging

**Decision:** Users can log bets that were placed in the past (before the app existed). These bypass the AI auto-settlement flow entirely — the user inputs the outcome at the time of logging.

**How it differs from a live bet:**

| | Live Bet | Past Bet |
|---|---|---|
| Status on creation | `pending` | `won` / `lost` / `void` (user selects) |
| AI settlement | Yes, triggered when match finishes | No — outcome entered manually |
| Match linking | Required (upcoming fixture) | Optional — can type match name as free text if the fixture is no longer in the upcoming list |
| Settled timestamp | Set automatically when AI resolves | Set to the match date the user provides |

**UI:** The "Log a bet" form has a toggle — **Live bet** (default) vs **Past bet**. When "Past bet" is selected:
- The status field becomes visible and required (won / lost / void).
- The match field accepts free text in addition to the fixture picker, since old matches won't appear in the upcoming fixtures list.
- The date/time field is editable (defaults to today but can be set to any past date).
- No AI call is made at any point.

**Effect on leaderboard and graphs:** Past bets are treated identically to settled live bets once logged — they feed into profit calculations, the balance-over-time graph, and all leaderboard metrics. The graph will reflect the correct chronological order based on the date the user provides.

**Admin note:** Admin can edit or delete any past bet, same as live bets.
