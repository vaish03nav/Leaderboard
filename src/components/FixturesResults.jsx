import { useEffect, useMemo, useState } from 'react'
import { listMatches, createMatch, syncFixturesFromApi } from '../api/matches'
import { listBettedMatchIds } from '../api/bets'
import { MatchTeams } from './TeamLogo'

const inputClass =
  'mt-1 w-full rounded-lg bg-slate-800 px-3 py-2 text-slate-100 outline-none ring-1 ring-slate-700 focus:ring-emerald-500'

// Status badges. TIMED (and SCHEDULED) are intentionally not shown — an
// upcoming fixture needs no tag.
const STATUS_STYLES = {
  IN_PLAY: 'bg-emerald-500/10 text-emerald-400 ring-emerald-500/30',
  PAUSED: 'bg-amber-500/10 text-amber-400 ring-amber-500/30',
  FINISHED: 'bg-sky-500/10 text-sky-400 ring-sky-500/30',
  POSTPONED: 'bg-amber-500/10 text-amber-400 ring-amber-500/30',
  CANCELLED: 'bg-red-500/10 text-red-400 ring-red-500/30',
}
const HIDDEN_STATUSES = new Set(['TIMED', 'SCHEDULED'])

function kickoff(iso) {
  if (!iso) return 'TBD'
  return new Date(iso).toLocaleString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function MatchRow({ m, hasBet }) {
  const hasScore = m.home_score !== null && m.away_score !== null
  const showBadge = !HIDDEN_STATUSES.has(m.status)
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl bg-slate-900 p-3 ring-1 ring-slate-800 transition hover:ring-slate-700 sm:p-4">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <MatchTeams
            home={m.home_team}
            away={m.away_team}
            homeCrest={m.home_crest}
            awayCrest={m.away_crest}
            size={22}
            className="font-medium"
          />
          {hasBet && (
            <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-400 ring-1 ring-emerald-500/30">
              🎯 Bet
            </span>
          )}
        </div>
        <p className="mt-0.5 text-xs text-slate-500 sm:text-sm">
          {kickoff(m.kickoff_time)}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-2 sm:gap-3">
        {hasScore && (
          <span className="text-base font-semibold sm:text-lg">
            {m.home_score}–{m.away_score}
          </span>
        )}
        {showBadge && (
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-medium ring-1 ${STATUS_STYLES[m.status]}`}
          >
            {m.status}
          </span>
        )}
      </div>
    </div>
  )
}

export default function FixturesResults({ onChange }) {
  const [matches, setMatches] = useState([])
  const [bettedIds, setBettedIds] = useState(new Set())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [view, setView] = useState('fixtures') // 'fixtures' | 'results'

  const [adding, setAdding] = useState(false)
  const [home, setHome] = useState('')
  const [away, setAway] = useState('')
  const [kickoffAt, setKickoffAt] = useState('')
  const [saving, setSaving] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [syncMsg, setSyncMsg] = useState(null)

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const [ms, ids] = await Promise.all([
        listMatches(),
        listBettedMatchIds(),
      ])
      setMatches(ms)
      setBettedIds(ids)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const upcoming = useMemo(
    () => matches.filter((m) => m.status !== 'FINISHED' && m.status !== 'CANCELLED'),
    [matches],
  )
  const results = useMemo(
    () => matches.filter((m) => m.status === 'FINISHED'),
    [matches],
  )
  // Results show most-recent first.
  const resultsSorted = useMemo(
    () => [...results].sort((a, b) => new Date(b.kickoff_time) - new Date(a.kickoff_time)),
    [results],
  )

  const shown = view === 'fixtures' ? upcoming : resultsSorted

  async function handleSync() {
    setSyncing(true)
    setSyncMsg(null)
    setError(null)
    try {
      const res = await syncFixturesFromApi()
      setSyncMsg(`Synced ${res.synced} fixtures from the API.`)
      await load()
      onChange?.()
    } catch (e) {
      setError(e.message)
    } finally {
      setSyncing(false)
    }
  }

  async function handleAdd(e) {
    e.preventDefault()
    if (!home.trim() || !away.trim()) return
    setSaving(true)
    setError(null)
    try {
      await createMatch({
        homeTeam: home,
        awayTeam: away,
        kickoffTime: kickoffAt ? new Date(kickoffAt).toISOString() : null,
      })
      setHome('')
      setAway('')
      setKickoffAt('')
      setAdding(false)
      await load()
      onChange?.()
    } catch (e) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex rounded-lg bg-slate-900 p-1 ring-1 ring-slate-800">
          {[
            { id: 'fixtures', label: `Fixtures (${upcoming.length})` },
            { id: 'results', label: `Results (${results.length})` },
          ].map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setView(t.id)}
              className={`rounded-md px-4 py-1.5 text-sm font-medium transition ${
                view === t.id
                  ? 'bg-emerald-500 text-slate-950'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleSync}
            disabled={syncing}
            className="rounded-lg bg-emerald-500/10 px-3 py-1.5 text-sm font-medium text-emerald-400 ring-1 ring-emerald-500/30 transition hover:bg-emerald-500/20 disabled:opacity-50"
          >
            {syncing ? 'Syncing…' : '↻ Sync from API'}
          </button>
          <button
            type="button"
            onClick={() => setAdding((v) => !v)}
            className="rounded-lg px-3 py-1.5 text-sm text-slate-300 ring-1 ring-slate-700 transition hover:ring-emerald-500/50"
          >
            {adding ? 'Cancel' : '+ Add fixture'}
          </button>
        </div>
      </div>

      {syncMsg && (
        <p className="mb-4 rounded-lg bg-emerald-500/10 px-4 py-2 text-sm text-emerald-400 ring-1 ring-emerald-500/30">
          {syncMsg}
        </p>
      )}
      {error && (
        <p className="mb-4 rounded-lg bg-red-500/10 px-4 py-2 text-sm text-red-400 ring-1 ring-red-500/30">
          {error}
        </p>
      )}

      {adding && (
        <form
          onSubmit={handleAdd}
          className="mb-6 rounded-xl bg-slate-900 p-5 ring-1 ring-slate-800"
        >
          <div className="grid grid-cols-2 gap-4">
            <label className="block text-sm text-slate-400">
              Home team
              <input
                value={home}
                onChange={(e) => setHome(e.target.value)}
                placeholder="Brazil"
                className={inputClass}
              />
            </label>
            <label className="block text-sm text-slate-400">
              Away team
              <input
                value={away}
                onChange={(e) => setAway(e.target.value)}
                placeholder="Argentina"
                className={inputClass}
              />
            </label>
          </div>
          <label className="mt-4 block text-sm text-slate-400">
            Kickoff (optional)
            <input
              type="datetime-local"
              value={kickoffAt}
              onChange={(e) => setKickoffAt(e.target.value)}
              className={inputClass}
            />
          </label>
          <button
            type="submit"
            disabled={saving}
            className="mt-4 rounded-lg bg-emerald-500 px-4 py-2 font-medium text-slate-950 transition hover:bg-emerald-400 disabled:opacity-50"
          >
            {saving ? 'Adding…' : 'Add fixture'}
          </button>
        </form>
      )}

      {loading ? (
        <p className="text-slate-500">Loading…</p>
      ) : shown.length === 0 ? (
        <p className="text-slate-500">
          {view === 'fixtures'
            ? 'No upcoming fixtures. Add one manually or sync from the API.'
            : 'No results yet.'}
        </p>
      ) : (
        <div className="space-y-2">
          {shown.map((m) => (
            <MatchRow key={m.id} m={m} hasBet={bettedIds.has(m.id)} />
          ))}
        </div>
      )}
    </div>
  )
}
