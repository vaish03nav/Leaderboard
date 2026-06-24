import { useState } from 'react'
import ProfileGate from './components/ProfileGate'
import Leaderboard from './components/Leaderboard'
import ProfilePage from './components/ProfilePage'
import FixturesResults from './components/FixturesResults'
import BetCentral from './components/BetCentral'
import { useSession } from './session/SessionContext'

const TABS = [
  { id: 'leaderboard', label: 'Leaderboard' },
  { id: 'profile', label: 'Profile' },
  { id: 'fixtures', label: 'Fixtures & Results' },
  { id: 'bet-central', label: 'Bet Central' },
]

function Home() {
  const { profile, clearProfile } = useSession()
  const [tab, setTab] = useState('leaderboard')
  // Bumped whenever a bet/deposit/fixture changes so dependent views reload.
  const [refreshKey, setRefreshKey] = useState(0)
  const bump = () => setRefreshKey((k) => k + 1)

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="sticky top-0 z-30 border-b border-slate-800 bg-slate-950/80 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-3 sm:px-6 sm:py-4">
          <div className="min-w-0">
            <h1 className="flex items-center gap-2 font-bold tracking-tight">
              <span className="text-base sm:text-lg">⚽ Daff</span>
              <span className="rounded bg-emerald-500/15 px-1.5 py-0.5 text-xs font-semibold text-emerald-400">
                FIFA WC
              </span>
            </h1>
            <p className="truncate text-xs text-slate-500 sm:text-sm">
              Signed in as {profile.display_name}
            </p>
          </div>
          <button
            type="button"
            onClick={clearProfile}
            className="shrink-0 rounded-lg px-3 py-1.5 text-xs text-slate-400 ring-1 ring-slate-700 transition hover:text-slate-200 hover:ring-slate-500 sm:text-sm"
          >
            Switch
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-6 sm:px-6 sm:py-8">
        <nav className="mb-6 -mx-4 flex gap-1 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:px-0 [&::-webkit-scrollbar]:hidden">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition ${
                tab === t.id
                  ? 'bg-emerald-500 text-slate-950'
                  : 'bg-slate-900 text-slate-400 ring-1 ring-slate-800 hover:text-slate-200'
              }`}
            >
              {t.label}
            </button>
          ))}
        </nav>

        {tab === 'leaderboard' && <Leaderboard refreshKey={refreshKey} />}
        {tab === 'profile' && <ProfilePage refreshKey={refreshKey} />}
        {tab === 'fixtures' && <FixturesResults onChange={bump} />}
        {tab === 'bet-central' && (
          <BetCentral refreshKey={refreshKey} onChange={bump} />
        )}
      </main>
    </div>
  )
}

function App() {
  const { profile } = useSession()
  if (!profile) return <ProfileGate />
  return <Home />
}

export default App
