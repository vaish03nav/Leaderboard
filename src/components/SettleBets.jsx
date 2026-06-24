import { useEffect, useMemo, useState } from 'react'
import { listPendingBets, setBetStatus } from '../api/bets'
import { formatINR } from '../lib/format'
import { MatchTeams } from './TeamLogo'

// Semi-auto settlement (PRD §12): the API supplies the result, the user
// confirms each pending bet as won / lost / void. We surface only pending
// bets whose linked fixture is FINISHED (a result exists).
export default function SettleBets({ refreshKey, onChange }) {
  const [pending, setPending] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [busyId, setBusyId] = useState(null)

  async function load() {
    setLoading(true)
    setError(null)
    try {
      setPending(await listPendingBets())
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey])

  // Group finished-match pending bets by fixture.
  const groups = useMemo(() => {
    const finished = pending.filter((b) => b.matches?.status === 'FINISHED')
    const map = new Map()
    for (const bet of finished) {
      const m = bet.matches
      const key = bet.match_id
      if (!map.has(key)) {
        map.set(key, {
          home: m.home_team,
          away: m.away_team,
          homeCrest: m.home_crest,
          awayCrest: m.away_crest,
          score: `${m.home_score}–${m.away_score}`,
          kickoff: m.kickoff_time,
          bets: [],
        })
      }
      map.get(key).bets.push(bet)
    }
    return [...map.values()].sort(
      (a, b) => new Date(b.kickoff) - new Date(a.kickoff),
    )
  }, [pending])

  async function settle(betId, status) {
    setBusyId(betId)
    setError(null)
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

  if (loading) return <p className="text-slate-500">Loading…</p>
  if (error)
    return (
      <p className="rounded-lg bg-red-500/10 px-4 py-2 text-sm text-red-400 ring-1 ring-red-500/30">
        {error}
      </p>
    )
  if (groups.length === 0)
    return (
      <p className="text-slate-500">
        No bets awaiting settlement. Pending bets appear here once their match
        is marked finished.
      </p>
    )

  return (
    <div className="space-y-5">
      <p className="text-sm text-slate-500">
        These matches have finished. Confirm each bet against the result.
      </p>
      {groups.map((g) => (
        <section key={`${g.home}-${g.away}`}>
          <div className="mb-2 flex items-baseline justify-between gap-2">
            <h3 className="font-semibold">
              <MatchTeams
                home={g.home}
                away={g.away}
                homeCrest={g.homeCrest}
                awayCrest={g.awayCrest}
              />
            </h3>
            <span className="shrink-0 rounded-full bg-sky-500/10 px-3 py-0.5 text-sm font-semibold text-sky-400 ring-1 ring-sky-500/30">
              Final {g.score}
            </span>
          </div>
          <div className="space-y-2">
            {g.bets.map((bet) => (
              <div
                key={bet.id}
                className="rounded-xl bg-slate-900 p-4 ring-1 ring-slate-800"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium">{bet.bet_description}</p>
                    <p className="text-sm text-slate-500">
                      {bet.profiles?.display_name ?? 'Unknown'} · stake{' '}
                      {formatINR(bet.stake_amount)} · ×{Number(bet.multiplier)}{' '}
                      · to win{' '}
                      {formatINR(
                        Number(bet.stake_amount) * Number(bet.multiplier),
                      )}
                    </p>
                  </div>
                </div>
                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    disabled={busyId === bet.id}
                    onClick={() => settle(bet.id, 'won')}
                    className="rounded-lg bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-400 ring-1 ring-emerald-500/30 transition hover:bg-emerald-500/20 disabled:opacity-40"
                  >
                    ✓ Won
                  </button>
                  <button
                    type="button"
                    disabled={busyId === bet.id}
                    onClick={() => settle(bet.id, 'lost')}
                    className="rounded-lg bg-red-500/10 px-3 py-1 text-xs font-medium text-red-400 ring-1 ring-red-500/30 transition hover:bg-red-500/20 disabled:opacity-40"
                  >
                    ✗ Lost
                  </button>
                  <button
                    type="button"
                    disabled={busyId === bet.id}
                    onClick={() => settle(bet.id, 'void')}
                    className="rounded-lg px-3 py-1 text-xs font-medium text-slate-400 ring-1 ring-slate-700 transition hover:ring-slate-500 disabled:opacity-40"
                  >
                    Void
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}
