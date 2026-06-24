import { formatINR } from '../lib/format'
import { groupPendingByMatch } from '../lib/stats'
import { MatchTeams } from './TeamLogo'

// Modal that surfaces all open (pending) bets across the group, shown over the
// leaderboard when live bets exist.
export default function LiveBetsPopup({ bets, onClose }) {
  const groups = groupPendingByMatch(bets)

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <div
        className="max-h-[80vh] w-full max-w-md overflow-y-auto rounded-2xl bg-slate-900 p-6 ring-1 ring-slate-700"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">🔴 Live bets</h2>
            <p className="text-sm text-slate-400">
              {bets.length} open {bets.length === 1 ? 'bet' : 'bets'} across the
              group
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-2 py-1 text-slate-400 ring-1 ring-slate-700 transition hover:text-slate-200"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="mt-4 space-y-4">
          {groups.map((g) => (
            <div key={g.label}>
              <p className="text-sm font-medium text-slate-300">
                <MatchTeams
                  home={g.home}
                  away={g.away}
                  homeCrest={g.homeCrest}
                  awayCrest={g.awayCrest}
                  label={g.label}
                  size={18}
                />
              </p>
              <div className="mt-1 space-y-1">
                {g.bets.map((bet) => (
                  <div
                    key={bet.id}
                    className="flex items-center justify-between gap-3 rounded-lg bg-slate-800 px-3 py-2 text-sm"
                  >
                    <span>
                      <span className="text-slate-400">
                        {bet.profiles?.display_name ?? 'Unknown'}:
                      </span>{' '}
                      {bet.bet_description}
                    </span>
                    <span className="shrink-0 text-emerald-400">
                      {formatINR(
                        Number(bet.stake_amount) * Number(bet.multiplier),
                      )}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={onClose}
          className="mt-6 w-full rounded-lg bg-emerald-500 px-4 py-2 font-medium text-slate-950 transition hover:bg-emerald-400"
        >
          Got it
        </button>
      </div>
    </div>
  )
}
