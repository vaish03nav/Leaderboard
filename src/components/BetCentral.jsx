import { useState } from 'react'
import PendingBets from './PendingBets'
import LogBetForm from './LogBetForm'
import SettleBets from './SettleBets'
import MyBets from './MyBets'

const SUBTABS = [
  { id: 'live', label: 'Live Bets' },
  { id: 'log', label: 'Log Bets' },
  { id: 'settle', label: 'Settle' },
  { id: 'mine', label: 'My Bets' },
]

export default function BetCentral({ refreshKey, onChange }) {
  const [sub, setSub] = useState('live')

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

      {sub === 'live' && <PendingBets refreshKey={refreshKey} />}
      {sub === 'log' && (
        <LogBetForm
          onLogged={() => {
            onChange?.()
            setSub('mine')
          }}
        />
      )}
      {sub === 'settle' && (
        <SettleBets refreshKey={refreshKey} onChange={onChange} />
      )}
      {sub === 'mine' && <MyBets refreshKey={refreshKey} onChange={onChange} />}
    </div>
  )
}
