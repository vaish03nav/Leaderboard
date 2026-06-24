import { supabase } from '../lib/supabase'

// Create a bet.
//  - Live bet: status defaults to 'pending', settled_at stays null.
//  - Past bet: caller passes status (won/lost/void) and the date it happened,
//    which becomes both placed_at and settled_at for correct graph ordering.
// match_id is null for now (free-text match_name); the fixture picker arrives
// in M5 and will populate match_id.
export async function createBet({
  profileId,
  matchId = null,
  matchName,
  betDescription,
  stakeAmount,
  multiplier,
  status = 'pending',
  placedAt = null,
  settledAt = null,
}) {
  const { data, error } = await supabase
    .from('bets')
    .insert({
      profile_id: profileId,
      match_id: matchId,
      match_name: matchName?.trim() || null,
      bet_description: betDescription.trim(),
      stake_amount: stakeAmount,
      multiplier,
      status,
      placed_at: placedAt ?? new Date().toISOString(),
      settled_at: settledAt,
    })
    .select()
    .single()

  if (error) throw error
  return data
}

// All bets for one profile, newest first.
export async function listBetsByProfile(profileId) {
  const { data, error } = await supabase
    .from('bets')
    .select('*, matches(home_team, away_team, home_crest, away_crest)')
    .eq('profile_id', profileId)
    .order('placed_at', { ascending: false })

  if (error) throw error
  return data
}

// Every bet across all profiles — used to compute the leaderboard.
export async function listAllBets() {
  const { data, error } = await supabase
    .from('bets')
    .select('*')
    .order('placed_at', { ascending: true })

  if (error) throw error
  return data
}

// All pending bets joined with their owner's profile, for the pending-bets
// view. Joined match row (when present) gives kickoff time + teams.
export async function listPendingBets() {
  const { data, error } = await supabase
    .from('bets')
    .select(
      '*, profiles(display_name, avatar), matches(home_team, away_team, home_crest, away_crest, kickoff_time, status, home_score, away_score)',
    )
    .eq('status', 'pending')
    .order('placed_at', { ascending: true })

  if (error) throw error
  return data
}

// Distinct fixture ids that have at least one bet linked — used to mark
// fixtures people have bet on. Returns a Set of match_id strings.
export async function listBettedMatchIds() {
  const { data, error } = await supabase
    .from('bets')
    .select('match_id')
    .not('match_id', 'is', null)

  if (error) throw error
  return new Set(data.map((r) => r.match_id))
}

// Settle (or re-settle) a bet: won / lost / void.
// settled_at is stamped now; setting back to pending clears it.
export async function setBetStatus(betId, status) {
  const { data, error } = await supabase
    .from('bets')
    .update({
      status,
      settled_at: status === 'pending' ? null : new Date().toISOString(),
    })
    .eq('id', betId)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteBet(betId) {
  const { error } = await supabase.from('bets').delete().eq('id', betId)
  if (error) throw error
}
