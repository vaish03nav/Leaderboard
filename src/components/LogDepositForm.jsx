import { useState } from 'react'
import { createDeposit } from '../api/deposits'
import { useSession } from '../session/SessionContext'

const inputClass =
  'mt-1 w-full rounded-lg bg-slate-800 px-3 py-2 text-slate-100 outline-none ring-1 ring-slate-700 focus:ring-emerald-500'

export default function LogDepositForm({ onLogged }) {
  const { profile } = useSession()
  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    const amountNum = Number(amount)
    if (!(amountNum > 0)) {
      setError('Amount must be greater than zero.')
      return
    }
    setSaving(true)
    try {
      await createDeposit({ profileId: profile.id, amount: amountNum, note })
      setAmount('')
      setNote('')
      onLogged?.()
    } catch (e) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl bg-slate-900 p-6 ring-1 ring-slate-800"
    >
      <h2 className="text-lg font-semibold">Log a deposit</h2>
      <p className="mt-1 text-sm text-slate-500">
        Money you've put into your Stake account.
      </p>

      {error && (
        <p className="mt-4 rounded-lg bg-red-500/10 px-4 py-2 text-sm text-red-400 ring-1 ring-red-500/30">
          {error}
        </p>
      )}

      <label className="mt-4 block text-sm text-slate-400">
        Amount (₹)
        <input
          type="number"
          min="0"
          step="0.01"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="1000"
          className={inputClass}
        />
      </label>

      <label className="mt-4 block text-sm text-slate-400">
        Note (optional)
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="e.g. opening balance"
          className={inputClass}
        />
      </label>

      <button
        type="submit"
        disabled={saving}
        className="mt-5 w-full rounded-lg bg-emerald-500 px-4 py-2 font-medium text-slate-950 transition hover:bg-emerald-400 disabled:opacity-50"
      >
        {saving ? 'Saving…' : 'Log deposit'}
      </button>
    </form>
  )
}
