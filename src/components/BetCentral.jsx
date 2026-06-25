import { useState } from 'react'
import PendingBets from './PendingBets'
import LogBets from './LogBets'
import MyBets from './MyBets'

const SUBTABS = [
  { id: 'log', label: 'Log Bets' },
  { id: 'live', label: 'Live Bets' },
  { id: 'mine', label: 'My Bets' },
]

export default function BetCentral({ refreshKey, onChange }) {
  const [sub, setSub] = useState('log')

  return (
    <div>
      <nav className="mb-6 inline-flex flex-wrap rounded-lg bg-slate-900 p-1 ring-1 ring-slate-800">
        {SUBTABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setSub(t.id)}
            className={`rounded-md px-4 py-1.5 text-sm font-medium transition ${
              sub === t.id
                ? 'bg-emerald-500 text-slate-950'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {t.label}
          </button>
        ))}
      </nav>

      {sub === 'log' && (
        <LogBets
          refreshKey={refreshKey}
          onChange={onChange}
          onLogged={() => {
            onChange?.()
            setSub('mine')
          }}
        />
      )}
      {sub === 'live' && <PendingBets refreshKey={refreshKey} />}
      {sub === 'mine' && <MyBets refreshKey={refreshKey} onChange={onChange} />}
    </div>
  )
}
