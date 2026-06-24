import { supabase } from '../lib/supabase'

// Fetch all profiles for the landing screen, newest names last.
export async function listProfiles() {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, display_name, avatar, is_admin, created_at')
    .order('created_at', { ascending: true })

  if (error) throw error
  return data
}

// Create a new profile. avatar is optional.
export async function createProfile({ displayName, avatar = null }) {
  const { data, error } = await supabase
    .from('profiles')
    .insert({ display_name: displayName.trim(), avatar })
    .select()
    .single()

  if (error) throw error
  return data
}
