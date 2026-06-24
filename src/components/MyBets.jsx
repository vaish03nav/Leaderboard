import { useEffect, useState } from 'react'
import { listBetsByProfile, setBetStatus, deleteBet } from '../api/bets'
import { useSession } from '../session/SessionContext'
import { formatINR, betReturn } from '../lib/format'
import { MatchTeams } from './TeamLogo'

const STATUS_STYLES = {
  pending: 'bg-amber-500/10 text-amber-400 ring-amber-500/30',
  won: 'bg-emerald-500/10 text-emerald-400 ring-emerald-500/30',
  lost: 'bg-red-500/10 text-red-400 ring-red-500/30',
  void: 'bg-slate-500/10 text-slate-400 ring-slate-500/30',
}

function StatusBadge({ status }) {
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ring-1 ${STATUS_STYLES[status]}`}
    >
      {status}
    </span>
  )
}

// `refreshKey` lets the parent force a reload after a new bet is logged.
export default function MyBets({ refreshKey, onChange }) {
  const { profile } = useSession()
  const [bets, setBets] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [busyId, setBusyId] = useState(null)

  async function load() {
    setLoading(true)
    setError(null)
    try {
      setBets(await listBetsByProfile(profile.id))
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile.id, refreshKey])

  async function settle(betId, status) {
    setBusyId(betId)
    try {
      await setBetStatus(betId, status)
      await load()
      onChange?.()
    } catch (e) {
      setError(e.message)
    } finally {
      setBusyId(null)
    }
  }

  async function remove(betId) {
    if (!confirm('Delete this bet? This cannot be undone.')) return
    setBusyId(betId)
    try {
      await deleteBet(betId)
      await load()
      onChange?.()
    } catch (e) {
      setError(e.message)
    } finally {
      setBusyId(null)
    }
  }

  if (loading) return <p className="text-slate-500">Loading bets…</p>
  if (error)
    return (
      <p className="rounded-lg bg-red-500/10 px-4 py-2 text-sm text-red-400 ring-1 ring-red-500/30">
        {error}
      </p>
    )
  if (bets.length === 0)
    return <p className="text-slate-500">No bets logged yet.</p>

  return (
    <div className="space-y-3">
      {bets.map((bet) => {
        const payout = Number(bet.stake_amount) * Number(bet.multiplier)
        const settled = bet.status !== 'pending'
        return (
          <div
            key={bet.id}
            className="rounded-xl bg-slate-900 p-4 ring-1 ring-slate-800"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-medium">{bet.bet_description}</p>
                <p className="text-sm text-slate-500">
                  {bet.matches ? (
                    <MatchTeams
                      home={bet.matches.home_team}
                      away={bet.matches.away_team}
                      homeCrest={bet.matches.home_crest}
                      awayCrest={bet.matches.away_crest}
                      size={16}
                    />
                  ) : (
                    bet.match_name || 'No match'
                  )}
                </p>
              </div>
              <StatusBadge status={bet.status} />
            </div>

            <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm text-slate-400">
              <span>Stake {formatINR(bet.stake_amount)}</span>
              <span>×{Number(bet.multiplier)}</span>
              <span>Potential {formatINR(payout)}</span>
              {settled && (
                <span className="text-slate-300">
                  Return {formatINR(betReturn(bet))}
                </span>
              )}
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              {/* Settle controls — hide the current status as a no-op */}
              {['won', 'lost', 'void'].map((s) => (
                <button
                  key={s}
                  type="button"
                  disabled={busyId === bet.id || bet.status === s}
                  onClick={() => settle(bet.id, s)}
                  className="rounded-lg px-3 py-1 text-xs font-medium capitalize ring-1 ring-slate-700 transition hover:ring-emerald-500/50 disabled:opacity-40"
                >
                  Mark {s}
                </button>
              ))}
              {settled && (
                <button
                  type="button"
                  disabled={busyId === bet.id}
                  onClick={() => settle(bet.id, 'pending')}
                  className="rounded-lg px-3 py-1 text-xs font-medium text-slate-400 ring-1 ring-slate-700 transition hover:ring-slate-500 disabled:opacity-40"
                >
                  Reset to pending
                </button>
              )}
              <button
                type="button"
                disabled={busyId === bet.id}
                onClick={() => remove(bet.id)}
                className="ml-auto rounded-lg px-3 py-1 text-xs font-medium text-red-400 ring-1 ring-red-500/30 transition hover:bg-red-500/10 disabled:opacity-40"
              >
                Delete
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}
