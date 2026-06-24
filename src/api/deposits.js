import { supabase } from '../lib/supabase'

// Log money put into the game by a profile.
export async function createDeposit({ profileId, amount, note = null }) {
  const { data, error } = await supabase
    .from('deposits')
    .insert({
      profile_id: profileId,
      amount,
      note: note?.trim() || null,
    })
    .select()
    .single()

  if (error) throw error
  return data
}

// Every deposit across all profiles — used to compute the leaderboard.
export async function listAllDeposits() {
  const { data, error } = await supabase
    .from('deposits')
    .select('*')

  if (error) throw error
  return data
}

// All deposits for one profile, newest first.
export async function listDepositsByProfile(profileId) {
  const { data, error } = await supabase
    .from('deposits')
    .select('*')
    .eq('profile_id', profileId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}
