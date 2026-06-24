import { betReturn } from './format'

// Build one leaderboard row per profile from raw deposits + bets.
// Nothing here is stored; it's all derived on the fly (PRD design principle).
//
// Definitions:
//   totalDeposited  sum of the profile's deposits
//   settled bets    status in won/lost/void (pending bets are not yet resolved
//                   so they don't affect profit)
//   totalStaked     sum of stakes on settled bets
//   totalReturns    sum of actual returns (won -> stake×mult, void -> stake,
//                   lost -> 0)
//   netProfit       totalReturns − totalStaked
//   profitPct       netProfit ÷ totalDeposited (0 when nothing deposited)
//   balance         totalDeposited + netProfit  ("money in hand")
//   largestWin      max return among won bets
//   winRate         won ÷ (won + lost)  — void excluded, 0 when none decided
export function buildLeaderboard(profiles, bets, deposits) {
  const byProfile = new Map(
    profiles.map((p) => [
      p.id,
      {
        profile: p,
        totalDeposited: 0,
        totalStaked: 0,
        totalReturns: 0,
        largestWin: 0,
        wonCount: 0,
        lostCount: 0,
        pendingCount: 0,
        betCount: 0,
      },
    ]),
  )

  for (const d of deposits) {
    const row = byProfile.get(d.profile_id)
    if (row) row.totalDeposited += Number(d.amount)
  }

  for (const b of bets) {
    const row = byProfile.get(b.profile_id)
    if (!row) continue
    row.betCount += 1

    if (b.status === 'pending') {
      row.pendingCount += 1
      continue // pending bets don't count toward profit yet
    }

    row.totalStaked += Number(b.stake_amount)
    const ret = betReturn(b)
    row.totalReturns += ret
    if (b.status === 'won') {
      row.wonCount += 1
      if (ret > row.largestWin) row.largestWin = ret
    } else if (b.status === 'lost') {
      row.lostCount += 1
    }
  }

  return [...byProfile.values()].map((r) => {
    const netProfit = r.totalReturns - r.totalStaked
    const decided = r.wonCount + r.lostCount
    return {
      ...r,
      netProfit,
      profitPct: r.totalDeposited > 0 ? netProfit / r.totalDeposited : 0,
      balance: r.totalDeposited + netProfit,
      winRate: decided > 0 ? r.wonCount / decided : 0,
    }
  })
}

// Sort metrics offered in the leaderboard UI. All sort descending.
export const SORT_OPTIONS = [
  { id: 'profitPct', label: 'Profit %' },
  { id: 'netProfit', label: 'Net profit' },
  { id: 'largestWin', label: 'Largest win' },
  { id: 'totalStaked', label: 'Total staked' },
  { id: 'winRate', label: 'Win rate' },
]

export function sortLeaderboard(rows, key) {
  return [...rows].sort((a, b) => b[key] - a[key])
}

// Group pending bets by match for the pending-bets view. Uses the joined
// fixture name when available, else the free-text match_name. Groups are
// ordered by soonest kickoff (matches with a kickoff first), then by name.
export function groupPendingByMatch(pendingBets) {
  const groups = new Map()

  for (const bet of pendingBets) {
    const fixture = bet.matches
    const label = fixture
      ? `${fixture.home_team} vs ${fixture.away_team}`
      : bet.match_name || 'Unspecified match'
    const kickoff = fixture?.kickoff_time ?? null

    if (!groups.has(label)) {
      groups.set(label, {
        label,
        kickoff,
        // Carry crests/teams through for logo rendering (null for free text).
        home: fixture?.home_team ?? null,
        away: fixture?.away_team ?? null,
        homeCrest: fixture?.home_crest ?? null,
        awayCrest: fixture?.away_crest ?? null,
        bets: [],
      })
    }
    groups.get(label).bets.push(bet)
  }

  return [...groups.values()].sort((a, b) => {
    if (a.kickoff && b.kickoff) return new Date(a.kickoff) - new Date(b.kickoff)
    if (a.kickoff) return -1
    if (b.kickoff) return 1
    return a.label.localeCompare(b.label)
  })
}
