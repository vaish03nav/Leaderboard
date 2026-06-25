import { useState } from 'react'
import LogBetForm from './LogBetForm'
import SettleBets from './SettleBets'

// "Log Bets" section — contains the bet-logging form plus a nested "Settle"
// section for confirming finished-match bets.
export default function LogBets({ refreshKey, onChange, onLogged }) {
  const [view, setView] = useState('log') // 'log' | 'settle'

  return (
    <div>
      <div className="mb-4 inline-flex rounded-lg bg-slate-800 p-1 ring-1 ring-slate-700">
        {[
          { id: 'log', label: 'Log a bet' },
          { id: 'settle', label: 'Settle' },
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

      {view === 'log' ? (
        <LogBetForm onLogged={onLogged} />
      ) : (
        <SettleBets refreshKey={refreshKey} onChange={onChange} />
      )}
    </div>
  )
}
