import { useEffect, useMemo, useState } from 'react'
import { listProfiles } from '../api/profiles'
import { listAllBets, listPendingBets } from '../api/bets'
import { listAllDeposits } from '../api/deposits'
import { useSession } from '../session/SessionContext'
import { formatINR } from '../lib/format'
import { buildLeaderboard, sortLeaderboard, SORT_OPTIONS } from '../lib/stats'
import LiveBetsPopup from './LiveBetsPopup'

const RANK_ACCENT = ['ring-amber-400/60', 'ring-slate-400/50', 'ring-orange-500/50']

function pct(n) {
  return `${(n * 100).toFixed(1)}%`
}

function signedINR(n) {
  const s = formatINR(Math.abs(n))
  if (n > 0) return `+${s}`
  if (n < 0) return `−${s}`
  return s
}

// Format a row's value for whichever metric is selected in "Sort by".
// Signed metrics (net profit, profit %) are tinted by sign; the rest are neutral.
function metricDisplay(row, key) {
  switch (key) {
    case 'netProfit':
      return { value: signedINR(row.netProfit), signed: row.netProfit }
    case 'profitPct':
      return { value: pct(row.profitPct), signed: row.netProfit }
    case 'largestWin':
      return { value: formatINR(row.largestWin), signed: null }
    case 'totalStaked':
      return { value: formatINR(row.totalStaked), signed: null }
    case 'winRate':
      return { value: pct(row.winRate), signed: null }
    default:
      return { value: '', signed: null }
  }
}

function toneClass(signed) {
  if (signed == null) return 'text-slate-100'
  if (signed > 0) return 'text-emerald-400'
  if (signed < 0) return 'text-red-400'
  return 'text-slate-300'
}

export default function Leaderboard({ refreshKey }) {
  const { profile: me } = useSession()
  const [profiles, setProfiles] = useState([])
  const [bets, setBets] = useState([])
  const [deposits, setDeposits] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [sortKey, setSortKey] = useState('profitPct')
  const [livePending, setLivePending] = useState([])
  const [showLivePopup, setShowLivePopup] = useState(false)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const [p, b, d, pending] = await Promise.all([
          listProfiles(),
          listAllBets(),
          listAllDeposits(),
          listPendingBets(),
        ])
        if (!cancelled) {
          setProfiles(p)
          setBets(b)
          setDeposits(d)
          setLivePending(pending)
          // Surface a popup when there are open bets across the group.
          setShowLivePopup(pending.length > 0)
        }
      } catch (e) {
        if (!cancelled) setError(e.message)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [refreshKey])

  const rows = useMemo(
    () => sortLeaderboard(buildLeaderboard(profiles, bets, deposits), sortKey),
    [profiles, bets, deposits, sortKey],
  )

  if (loading) return <p className="text-slate-500">Loading leaderboard…</p>
  if (error)
    return (
      <p className="rounded-lg bg-red-500/10 px-4 py-2 text-sm text-red-400 ring-1 ring-red-500/30">
        {error}
      </p>
    )
  if (rows.length === 0)
    return <p className="text-slate-500">No profiles yet.</p>

  return (
    <div>
      {showLivePopup && (
        <LiveBetsPopup
          bets={livePending}
          onClose={() => setShowLivePopup(false)}
        />
      )}
      <div className="mb-4 flex items-center gap-2 text-sm">
        <span className="text-slate-400">Sort by</span>
        <select
          value={sortKey}
          onChange={(e) => setSortKey(e.target.value)}
          className="rounded-lg bg-slate-800 px-3 py-1.5 text-slate-100 outline-none ring-1 ring-slate-700 focus:ring-emerald-500"
        >
          {SORT_OPTIONS.map((o) => (
            <option key={o.id} value={o.id}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        {rows.map((r, i) => {
          const isMe = r.profile.id === me.id
          const topAccent = i < 3 ? RANK_ACCENT[i] : 'ring-slate-800'
          const metric = metricDisplay(r, sortKey)
          const sortLabel =
            SORT_OPTIONS.find((o) => o.id === sortKey)?.label ?? ''
          return (
            <div
              key={r.profile.id}
              className={`rounded-xl bg-slate-900 p-4 ring-1 ${topAccent} ${
                isMe ? 'outline outline-1 outline-emerald-500/40' : ''
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="w-7 shrink-0 text-center text-lg font-bold text-slate-500">
                  {['🥇', '🥈', '🥉'][i] ?? i + 1}
                </span>
                <div className="flex-1">
                  <p className="font-medium">
                    {r.profile.display_name}
                    {isMe && (
                      <span className="ml-2 text-xs text-emerald-400">you</span>
                    )}
                  </p>
                  <p className="text-sm text-slate-500">
                    {r.betCount} bets · {r.pendingCount} pending
                  </p>
                </div>
                <div className="text-right">
                  <p className={`text-lg font-semibold ${toneClass(metric.signed)}`}>
                    {metric.value}
                  </p>
                  <p className="text-xs text-slate-500">{sortLabel}</p>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
