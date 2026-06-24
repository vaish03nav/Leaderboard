import { betReturn } from './format'

// Per-bet profit contribution (settled bets only):
//   won  -> stake × (mult − 1)   (winnings)
//   void -> 0                     (stake refunded)
//   lost -> −stake
function betDelta(bet) {
  if (bet.status === 'pending') return 0
  return betReturn(bet) - Number(bet.stake_amount)
}

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

// Build a running-balance time series from deposits + settled bets, ordered
// chronologically. Deposits move on their created_at; bets on settled_at
// (falling back to placed_at). Each point carries the cumulative balance.
export function balanceOverTime(bets, deposits) {
  const events = []

  for (const d of deposits) {
    events.push({
      date: d.created_at,
      delta: Number(d.amount),
      label: `Deposit ₹${Number(d.amount)}`,
    })
  }
  for (const b of bets) {
    if (b.status === 'pending') continue
    events.push({
      date: b.settled_at ?? b.placed_at,
      delta: betDelta(b),
      label: `${b.bet_description} (${b.status})`,
    })
  }

  events.sort((a, b) => new Date(a.date) - new Date(b.date))

  let running = 0
  return events.map((e) => {
    running += e.delta
    return {
      date: e.date,
      balance: Math.round(running * 100) / 100,
      label: e.label,
    }
  })
}
