// INR-only formatting helpers (PRD: all figures shown in ₹).

const inr = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 2,
})

export function formatINR(amount) {
  return inr.format(Number(amount) || 0)
}

// Actual return of a settled bet:
//   won  -> stake × multiplier (full payout)
//   void -> stake refunded
//   lost -> 0
//   pending -> 0 (not yet settled)
export function betReturn(bet) {
  switch (bet.status) {
    case 'won':
      return Number(bet.stake_amount) * Number(bet.multiplier)
    case 'void':
      return Number(bet.stake_amount)
    default:
      return 0
  }
}
