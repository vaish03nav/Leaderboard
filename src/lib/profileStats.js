import { betReturn } from './format'

// Summary stats for one profile (same definitions as the leaderboard).
export function profileSummary(bets, deposits) {
  const totalDeposited = deposits.reduce((s, d) => s + Number(d.amount), 0)
  const settled = bets.filter((b) => b.status !== 'pending')

  let totalStaked = 0
  let totalReturns = 0
  let largestWin = 0
  let won = 0
  let lost = 0
  for (const b of settled) {
    totalStaked += Number(b.stake_amount)
    const ret = betReturn(b)
    totalReturns += ret
    if (b.status === 'won') {
      won += 1
      if (ret > largestWin) largestWin = ret
    } else if (b.status === 'lost') {
      lost += 1
    }
  }

  const netProfit = totalReturns - totalStaked
  const decided = won + lost
  return {
    totalDeposited,
    totalStaked,
    netProfit,
    balance: totalDeposited + netProfit,
    profitPct: totalDeposited > 0 ? netProfit / totalDeposited : 0,
    largestWin,
    winRate: decided > 0 ? won / decided : 0,
    betCount: bets.length,
    pendingCount: bets.length - settled.length,
  }
}

// Build a cumulative-PROFIT time series for every profile, keyed by date.
// Deposits are intentionally excluded — this tracks betting profit only.
// Each point is { date, [profileId]: cumulativeProfit, ... } so the chart can
// overlay one line per user (the viewed user prominent, others faint).
export function profitOverTime(profiles, bets) {
  const events = bets
    .filter((b) => b.status !== 'pending')
    .map((b) => ({
      date: b.settled_at ?? b.placed_at,
      pid: b.profile_id,
      delta: betReturn(b) - Number(b.stake_amount), // won:+winnings, lost:-stake
    }))
    .sort((a, b) => new Date(a.date) - new Date(b.date))

  const running = {}
  for (const p of profiles) running[p.id] = 0

  const points = []
  for (const e of events) {
    if (!(e.pid in running)) running[e.pid] = 0
    running[e.pid] += e.delta
    points.push({ date: e.date, ...running })
  }
  return points
}

