import { supabase } from '../lib/supabase'

// All fixtures, soonest kickoff first (nulls last).
export async function listMatches() {
  const { data, error } = await supabase
    .from('matches')
    .select('*')
    .order('kickoff_time', { ascending: true, nullsFirst: false })

  if (error) throw error
  return data
}

// Upcoming fixtures only — used to populate the bet-logging dropdown.
// Anything not yet finished/cancelled and either no kickoff or kickoff today+.
export async function listUpcomingMatches() {
  const { data, error } = await supabase
    .from('matches')
    .select('*')
    .in('status', ['SCHEDULED', 'TIMED', 'IN_PLAY', 'PAUSED'])
    .order('kickoff_time', { ascending: true, nullsFirst: false })

  if (error) throw error
  return data
}

// Manual fixture entry (fallback when the API is unavailable).
export async function createMatch({
  homeTeam,
  awayTeam,
  kickoffTime = null,
  status = 'SCHEDULED',
}) {
  const { data, error } = await supabase
    .from('matches')
    .insert({
      home_team: homeTeam.trim(),
      away_team: awayTeam.trim(),
      kickoff_time: kickoffTime || null,
      status,
    })
    .select()
    .single()

  if (error) throw error
  return data
}

// Trigger the server-side Edge Function that pulls fixtures/results from
// football-data.org into the matches table. Returns { synced: N }.
export async function syncFixturesFromApi() {
  const { data, error } = await supabase.functions.invoke('sync-fixtures')
  if (error) throw error
  if (data?.error) throw new Error(data.error)
  return data
}

// Update a fixture's status and/or score (manual or post-fetch).
export async function updateMatch(id, fields) {
  const { data, error } = await supabase
    .from('matches')
    .update(fields)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}
