import { useEffect, useMemo, useState } from 'react'
import { listPendingBets } from '../api/bets'
import { formatINR } from '../lib/format'
import { groupPendingByMatch } from '../lib/stats'
import { MatchTeams } from './TeamLogo'

function kickoffLabel(iso) {
  if (!iso) return null
  return new Date(iso).toLocaleString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function PendingBets({ refreshKey }) {
  const [pending, setPending] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const data = await listPendingBets()
        if (!cancelled) setPending(data)
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

  const groups = useMemo(() => groupPendingByMatch(pending), [pending])

  if (loading) return <p className="text-slate-500">Loading pending bets…</p>
  if (error)
    return (
      <p className="rounded-lg bg-red-500/10 px-4 py-2 text-sm text-red-400 ring-1 ring-red-500/30">
        {error}
      </p>
    )
  if (groups.length === 0)
    return <p className="text-slate-500">No pending bets across the group.</p>

  return (
    <div className="space-y-5">
      {groups.map((group) => (
        <section key={group.label}>
          <div className="mb-2 flex items-baseline justify-between gap-2">
            <h3 className="font-semibold">
              <MatchTeams
                home={group.home}
                away={group.away}
                homeCrest={group.homeCrest}
                awayCrest={group.awayCrest}
                label={group.label}
              />
            </h3>
            {group.kickoff ? (
              <span className="text-sm text-slate-500">
                {kickoffLabel(group.kickoff)}
              </span>
            ) : (
              <span className="text-sm text-slate-600">no kickoff time</span>
            )}
          </div>

          <div className="space-y-2">
            {group.bets.map((bet) => {
              const payout =
                Number(bet.stake_amount) * Number(bet.multiplier)
              return (
                <div
                  key={bet.id}
                  className="flex items-center justify-between gap-3 rounded-xl bg-slate-900 p-4 ring-1 ring-slate-800"
                >
                  <div>
                    <p className="font-medium">{bet.bet_description}</p>
                    <p className="text-sm text-slate-500">
                      {bet.profiles?.display_name ?? 'Unknown'} · stake{' '}
                      {formatINR(bet.stake_amount)} · ×
                      {Number(bet.multiplier)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-slate-500">to win</p>
                    <p className="font-semibold text-emerald-400">
                      {formatINR(payout)}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      ))}
    </div>
  )
}
