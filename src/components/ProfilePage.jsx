import { useEffect, useMemo, useState } from 'react'
import { listProfiles } from '../api/profiles'
import { listBetsByProfile, listAllBets } from '../api/bets'
import { listDepositsByProfile } from '../api/deposits'
import { useSession } from '../session/SessionContext'
import { formatINR } from '../lib/format'
import { profileSummary, profitOverTime } from '../lib/profileStats'
import ProfitChart from './ProfitChart'
import LogDepositForm from './LogDepositForm'

const FILTERS = ['all', 'pending', 'won', 'lost', 'void']

const STATUS_STYLES = {
  pending: 'bg-amber-500/10 text-amber-400 ring-amber-500/30',
  won: 'bg-emerald-500/10 text-emerald-400 ring-emerald-500/30',
  lost: 'bg-red-500/10 text-red-400 ring-red-500/30',
  void: 'bg-slate-500/10 text-slate-400 ring-slate-500/30',
}

function Stat({ label, value, tone }) {
  return (
    <div className="rounded-xl bg-slate-900 p-4 ring-1 ring-slate-800">
      <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
      <p className={`mt-1 text-lg font-semibold ${tone ?? 'text-slate-100'}`}>
        {value}
      </p>
    </div>
  )
}

function pct(n) {
  return `${(n * 100).toFixed(1)}%`
}

export default function ProfilePage({ refreshKey }) {
  const { profile: me } = useSession()
  const [profiles, setProfiles] = useState([])
  const [selectedId, setSelectedId] = useState(me.id)
  const [bets, setBets] = useState([])
  const [allBets, setAllBets] = useState([])
  const [deposits, setDeposits] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filter, setFilter] = useState('all')
  const [showDeposit, setShowDeposit] = useState(false)
  const [localRefresh, setLocalRefresh] = useState(0)

  useEffect(() => {
    listProfiles().then(setProfiles).catch((e) => setError(e.message))
  }, [])

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const [b, d, all] = await Promise.all([
          listBetsByProfile(selectedId),
          listDepositsByProfile(selectedId),
          listAllBets(), // for the multi-user profit comparison chart
        ])
        if (!cancelled) {
          setBets(b)
          setDeposits(d)
          setAllBets(all)
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
  }, [selectedId, refreshKey, localRefresh])

  const viewingSelf = selectedId === me.id

  const summary = useMemo(
    () => profileSummary(bets, deposits),
    [bets, deposits],
  )
  const profitSeries = useMemo(
    () => profitOverTime(profiles, allBets),
    [profiles, allBets],
  )
  const visibleBets = useMemo(
    () => (filter === 'all' ? bets : bets.filter((b) => b.status === filter)),
    [bets, filter],
  )

  const selectedName =
    profiles.find((p) => p.id === selectedId)?.display_name ?? '…'

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center gap-2 text-sm">
        <span className="text-slate-400">Viewing</span>
        <select
          value={selectedId}
          onChange={(e) => setSelectedId(e.target.value)}
          className="rounded-lg bg-slate-800 px-3 py-1.5 text-slate-100 outline-none ring-1 ring-slate-700 focus:ring-emerald-500"
        >
          {profiles.map((p) => (
            <option key={p.id} value={p.id}>
              {p.display_name}
              {p.id === me.id ? ' (you)' : ''}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => setShowDeposit(true)}
          className="ml-auto rounded-lg bg-emerald-500/10 px-3 py-1.5 font-medium text-emerald-400 ring-1 ring-emerald-500/30 transition hover:bg-emerald-500/20"
        >
          + Log deposit
        </button>
      </div>

      {showDeposit && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={() => setShowDeposit(false)}
        >
          <div
            className="w-full max-w-sm"
            onClick={(e) => e.stopPropagation()}
          >
            <LogDepositForm
              onLogged={() => {
                setShowDeposit(false)
                // Reflect the new deposit if viewing your own profile.
                if (viewingSelf) setLocalRefresh((n) => n + 1)
              }}
            />
            <button
              type="button"
              onClick={() => setShowDeposit(false)}
              className="mt-2 w-full rounded-lg px-4 py-2 text-sm text-slate-400 ring-1 ring-slate-700 transition hover:text-slate-200"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {error && (
        <p className="mb-4 rounded-lg bg-red-500/10 px-4 py-2 text-sm text-red-400 ring-1 ring-red-500/30">
          {error}
        </p>
      )}

      {loading ? (
        <p className="text-slate-500">Loading {selectedName}…</p>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <Stat
              label="Net profit"
              value={formatINR(summary.netProfit)}
              tone={
                summary.netProfit > 0
                  ? 'text-emerald-400'
                  : summary.netProfit < 0
                    ? 'text-red-400'
                    : 'text-slate-100'
              }
            />
            <Stat label="Profit %" value={pct(summary.profitPct)} />
            <Stat label="Balance" value={formatINR(summary.balance)} />
            <Stat label="Deposited" value={formatINR(summary.totalDeposited)} />
            <Stat label="Total staked" value={formatINR(summary.totalStaked)} />
            <Stat label="Largest win" value={formatINR(summary.largestWin)} />
            <Stat label="Win rate" value={pct(summary.winRate)} />
            <Stat label="Bets" value={summary.betCount} />
            <Stat label="Pending" value={summary.pendingCount} />
          </div>

          <section className="mt-8">
            <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
              <h3 className="font-semibold">Profit over time</h3>
              <span className="text-xs text-slate-500">
                {selectedName} highlighted · others shown faintly
              </span>
            </div>
            <div className="rounded-xl bg-slate-900 p-4 ring-1 ring-slate-800">
              <ProfitChart
                data={profitSeries}
                profiles={profiles}
                selectedId={selectedId}
              />
            </div>
          </section>

          <section className="mt-8">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <h3 className="font-semibold">Bet history</h3>
              <div className="ml-auto inline-flex rounded-lg bg-slate-900 p-1 ring-1 ring-slate-800">
                {FILTERS.map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setFilter(f)}
                    className={`rounded-md px-3 py-1 text-xs font-medium capitalize transition ${
                      filter === f
                        ? 'bg-emerald-500 text-slate-950'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            {visibleBets.length === 0 ? (
              <p className="text-slate-500">No {filter === 'all' ? '' : filter} bets.</p>
            ) : (
              <div className="space-y-2">
                {visibleBets.map((bet) => (
                  <div
                    key={bet.id}
                    className="flex items-center justify-between gap-3 rounded-xl bg-slate-900 p-4 ring-1 ring-slate-800"
                  >
                    <div>
                      <p className="font-medium">{bet.bet_description}</p>
                      <p className="text-sm text-slate-500">
                        {bet.match_name || 'No match'} ·{' '}
                        {new Date(bet.placed_at).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                        })}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <span className="text-slate-400">
                        {formatINR(bet.stake_amount)} ×{Number(bet.multiplier)}
                      </span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ring-1 ${STATUS_STYLES[bet.status]}`}
                      >
                        {bet.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  )
}
