import { useEffect, useMemo, useState } from 'react'
import { createBet } from '../api/bets'
import { listMatches } from '../api/matches'
import { useSession } from '../session/SessionContext'
import { formatINR } from '../lib/format'

function matchLabel(m) {
  const when = m.kickoff_time
    ? new Date(m.kickoff_time).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
      })
    : 'TBD'
  return `${m.home_team} vs ${m.away_team} (${when})`
}

const inputClass =
  'mt-1 w-full rounded-lg bg-slate-800 px-3 py-2 text-slate-100 outline-none ring-1 ring-slate-700 focus:ring-emerald-500'

// Sentinel value for the "type it manually" option in the past-bet dropdown.
const OTHER = '__other__'

// yyyy-mm-dd for the date input's default value (today).
function todayStr() {
  return new Date().toISOString().slice(0, 10)
}

export default function LogBetForm({ onLogged }) {
  const { profile } = useSession()
  const [mode, setMode] = useState('live') // 'live' | 'past'

  const [matchName, setMatchName] = useState('') // free text (past "Other")
  const [matchId, setMatchId] = useState('') // selected fixture id
  const [description, setDescription] = useState('')
  const [stake, setStake] = useState('')
  const [multiplier, setMultiplier] = useState('')
  const [status, setStatus] = useState('won') // past bets only
  const [date, setDate] = useState(todayStr()) // past bets only

  const [matches, setMatches] = useState([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  // Load all fixtures once: upcoming feed the live dropdown, finished feed the
  // past-bet dropdown.
  useEffect(() => {
    listMatches()
      .then(setMatches)
      .catch((e) => setError(e.message))
  }, [])

  const upcoming = useMemo(
    () =>
      matches.filter((m) => m.status !== 'FINISHED' && m.status !== 'CANCELLED'),
    [matches],
  )
  // Past bets are on games already played — list finished fixtures, newest first.
  const finished = useMemo(
    () =>
      matches
        .filter((m) => m.status === 'FINISHED')
        .sort((a, b) => new Date(b.kickoff_time) - new Date(a.kickoff_time)),
    [matches],
  )

  const stakeNum = Number(stake)
  const multNum = Number(multiplier)
  const potentialPayout = stakeNum > 0 && multNum > 0 ? stakeNum * multNum : 0

  function reset() {
    setMatchName('')
    setMatchId('')
    setDescription('')
    setStake('')
    setMultiplier('')
    setStatus('won')
    setDate(todayStr())
  }

  // When picking a finished fixture for a past bet, auto-fill the date to the
  // match day so the profit graph orders correctly.
  function handlePastMatchChange(value) {
    setMatchId(value)
    if (value && value !== OTHER) {
      const m = finished.find((f) => f.id === value)
      if (m?.kickoff_time) setDate(new Date(m.kickoff_time).toISOString().slice(0, 10))
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)

    const isPast = mode === 'past'
    const typingFreeText = isPast && matchId === OTHER

    if (isPast) {
      if (!matchId) {
        setError('Please select a match.')
        return
      }
      if (typingFreeText && !matchName.trim()) {
        setError('Match name is required.')
        return
      }
    } else if (!matchId) {
      setError('Please select a fixture.')
      return
    }
    if (!description.trim()) {
      setError('Bet description is required.')
      return
    }
    if (!(stakeNum > 0) || !(multNum > 0)) {
      setError('Stake and multiplier must be greater than zero.')
      return
    }

    setSaving(true)
    try {
      const pastIso = isPast ? new Date(date).toISOString() : null
      const fixture = matches.find((f) => f.id === matchId)
      const linkedId = typingFreeText ? null : matchId
      await createBet({
        profileId: profile.id,
        matchId: linkedId,
        matchName: typingFreeText
          ? matchName
          : fixture
            ? `${fixture.home_team} vs ${fixture.away_team}`
            : null,
        betDescription: description,
        stakeAmount: stakeNum,
        multiplier: multNum,
        status: isPast ? status : 'pending',
        placedAt: pastIso,
        settledAt: pastIso,
      })
      reset()
      onLogged?.()
    } catch (e) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  function switchMode(m) {
    setMode(m)
    setMatchId('')
    setMatchName('')
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl bg-slate-900 p-6 ring-1 ring-slate-800"
    >
      <h2 className="text-lg font-semibold">Log a bet</h2>

      {/* Live / Past toggle */}
      <div className="mt-4 inline-flex rounded-lg bg-slate-800 p-1 ring-1 ring-slate-700">
        {['live', 'past'].map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => switchMode(m)}
            className={`rounded-md px-4 py-1.5 text-sm font-medium capitalize transition ${
              mode === m
                ? 'bg-emerald-500 text-slate-950'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {m} bet
          </button>
        ))}
      </div>

      {error && (
        <p className="mt-4 rounded-lg bg-red-500/10 px-4 py-2 text-sm text-red-400 ring-1 ring-red-500/30">
          {error}
        </p>
      )}

      {/* Match selection */}
      {mode === 'live' ? (
        <label className="mt-4 block text-sm text-slate-400">
          Fixture
          {upcoming.length === 0 ? (
            <p className="mt-1 rounded-lg bg-slate-800 px-3 py-2 text-sm text-slate-500 ring-1 ring-slate-700">
              No upcoming fixtures yet — add some on the Fixtures tab, or log
              this as a past bet.
            </p>
          ) : (
            <select
              value={matchId}
              onChange={(e) => setMatchId(e.target.value)}
              className={inputClass}
            >
              <option value="">Select a match…</option>
              {upcoming.map((m) => (
                <option key={m.id} value={m.id}>
                  {matchLabel(m)}
                </option>
              ))}
            </select>
          )}
        </label>
      ) : (
        <label className="mt-4 block text-sm text-slate-400">
          Match
          <select
            value={matchId}
            onChange={(e) => handlePastMatchChange(e.target.value)}
            className={inputClass}
          >
            <option value="">Select a match…</option>
            {finished.map((m) => (
              <option key={m.id} value={m.id}>
                {matchLabel(m)}
              </option>
            ))}
            <option value={OTHER}>Other — type it manually</option>
          </select>
          {matchId === OTHER && (
            <input
              value={matchName}
              onChange={(e) => setMatchName(e.target.value)}
              placeholder="e.g. Brazil vs Argentina"
              className={`${inputClass} mt-2`}
            />
          )}
        </label>
      )}

      <label className="mt-4 block text-sm text-slate-400">
        Bet description
        <input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="e.g. Brazil to win"
          className={inputClass}
        />
      </label>

      <div className="mt-4 grid grid-cols-2 gap-4">
        <label className="block text-sm text-slate-400">
          Stake (₹)
          <input
            type="number"
            min="0"
            step="0.01"
            value={stake}
            onChange={(e) => setStake(e.target.value)}
            placeholder="500"
            className={inputClass}
          />
        </label>
        <label className="block text-sm text-slate-400">
          Multiplier (odds)
          <input
            type="number"
            min="0"
            step="0.01"
            value={multiplier}
            onChange={(e) => setMultiplier(e.target.value)}
            placeholder="2.5"
            className={inputClass}
          />
        </label>
      </div>

      {/* Past-bet-only fields: outcome + date */}
      {mode === 'past' && (
        <div className="mt-4 grid grid-cols-2 gap-4">
          <label className="block text-sm text-slate-400">
            Outcome
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className={inputClass}
            >
              <option value="won">Won</option>
              <option value="lost">Lost</option>
              <option value="void">Void</option>
            </select>
          </label>
          <label className="block text-sm text-slate-400">
            Date
            <input
              type="date"
              value={date}
              max={todayStr()}
              onChange={(e) => setDate(e.target.value)}
              className={inputClass}
            />
          </label>
        </div>
      )}

      <p className="mt-4 text-sm text-slate-500">
        Potential payout:{' '}
        <span className="font-medium text-slate-300">
          {formatINR(potentialPayout)}
        </span>
      </p>

      <button
        type="submit"
        disabled={saving}
        className="mt-5 w-full rounded-lg bg-emerald-500 px-4 py-2 font-medium text-slate-950 transition hover:bg-emerald-400 disabled:opacity-50"
      >
        {saving ? 'Saving…' : mode === 'live' ? 'Log pending bet' : 'Log past bet'}
      </button>
    </form>
  )
}
