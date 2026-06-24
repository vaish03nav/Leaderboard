import { useEffect, useState } from 'react'
import { listProfiles, createProfile } from '../api/profiles'
import { useSession } from '../session/SessionContext'

// Initials fallback when a profile has no avatar image.
function initials(name) {
  return name
    .split(' ')
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

function Avatar({ profile }) {
  if (profile.avatar) {
    return (
      <img
        src={profile.avatar}
        alt=""
        className="h-16 w-16 rounded-full object-cover ring-2 ring-slate-700"
      />
    )
  }
  return (
    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/15 text-lg font-semibold text-emerald-400 ring-2 ring-emerald-500/30">
      {initials(profile.display_name)}
    </div>
  )
}

export default function ProfileGate() {
  const { selectProfile } = useSession()
  const [profiles, setProfiles] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [creating, setCreating] = useState(false)
  const [name, setName] = useState('')
  const [avatar, setAvatar] = useState('')
  const [saving, setSaving] = useState(false)

  async function load() {
    setLoading(true)
    setError(null)
    try {
      setProfiles(await listProfiles())
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  async function handleCreate(e) {
    e.preventDefault()
    if (!name.trim()) return
    setSaving(true)
    setError(null)
    try {
      const profile = await createProfile({
        displayName: name,
        avatar: avatar.trim() || null,
      })
      selectProfile(profile) // creating a profile also selects it
    } catch (e) {
      setError(e.message)
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-3xl px-6 py-16">
        <header className="text-center">
          <h1 className="text-3xl font-bold tracking-tight">
            Group Stake Tracker
          </h1>
          <p className="mt-2 text-slate-400">Who's playing? Pick your profile.</p>
        </header>

        {error && (
          <p className="mt-6 rounded-lg bg-red-500/10 px-4 py-3 text-center text-sm text-red-400 ring-1 ring-red-500/30">
            {error}
          </p>
        )}

        {loading ? (
          <p className="mt-10 text-center text-slate-500">Loading profiles…</p>
        ) : (
          <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3">
            {profiles.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => selectProfile(p)}
                className="flex flex-col items-center gap-3 rounded-xl bg-slate-900 p-5 ring-1 ring-slate-800 transition hover:ring-emerald-500/50"
              >
                <Avatar profile={p} />
                <span className="font-medium">{p.display_name}</span>
                {p.is_admin && (
                  <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-xs text-amber-400">
                    admin
                  </span>
                )}
              </button>
            ))}

            {!creating && (
              <button
                type="button"
                onClick={() => setCreating(true)}
                className="flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-slate-700 p-5 text-slate-400 transition hover:border-emerald-500/50 hover:text-emerald-400"
              >
                <span className="text-3xl leading-none">+</span>
                <span className="font-medium">Create profile</span>
              </button>
            )}
          </div>
        )}

        {creating && (
          <form
            onSubmit={handleCreate}
            className="mx-auto mt-8 max-w-sm rounded-xl bg-slate-900 p-6 ring-1 ring-slate-800"
          >
            <h2 className="text-lg font-semibold">New profile</h2>
            <label className="mt-4 block text-sm text-slate-400">
              Display name
              <input
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Alex"
                className="mt-1 w-full rounded-lg bg-slate-800 px-3 py-2 text-slate-100 outline-none ring-1 ring-slate-700 focus:ring-emerald-500"
              />
            </label>
            <label className="mt-4 block text-sm text-slate-400">
              Avatar image URL (optional)
              <input
                value={avatar}
                onChange={(e) => setAvatar(e.target.value)}
                placeholder="https://…"
                className="mt-1 w-full rounded-lg bg-slate-800 px-3 py-2 text-slate-100 outline-none ring-1 ring-slate-700 focus:ring-emerald-500"
              />
            </label>
            <div className="mt-5 flex gap-3">
              <button
                type="submit"
                disabled={saving || !name.trim()}
                className="flex-1 rounded-lg bg-emerald-500 px-4 py-2 font-medium text-slate-950 transition hover:bg-emerald-400 disabled:opacity-50"
              >
                {saving ? 'Creating…' : 'Create & continue'}
              </button>
              <button
                type="button"
                onClick={() => setCreating(false)}
                className="rounded-lg px-4 py-2 text-slate-400 hover:text-slate-200"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
