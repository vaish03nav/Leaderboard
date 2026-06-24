import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { formatINR } from '../lib/format'

function dayLabel(iso) {
  return new Date(iso).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
  })
}

function ChartTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  const point = payload[0].payload
  return (
    <div className="rounded-lg bg-slate-800 px-3 py-2 text-sm ring-1 ring-slate-700">
      <p className="font-medium text-slate-100">
        {formatINR(point.balance)}
      </p>
      <p className="text-xs text-slate-400">{dayLabel(point.date)}</p>
      <p className="mt-1 text-xs text-slate-500">{point.label}</p>
    </div>
  )
}

export default function BalanceChart({ data }) {
  if (data.length === 0)
    return (
      <p className="text-slate-500">
        No settled activity yet — log a deposit or settle a bet to see the graph.
      </p>
    )

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
          <XAxis
            dataKey="date"
            tickFormatter={dayLabel}
            stroke="#64748b"
            fontSize={12}
          />
          <YAxis
            stroke="#64748b"
            fontSize={12}
            tickFormatter={(v) => `₹${v}`}
            width={56}
          />
          <Tooltip content={<ChartTooltip />} />
          <Line
            type="monotone"
            dataKey="balance"
            stroke="#34d399"
            strokeWidth={2}
            dot={{ r: 3, fill: '#34d399' }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
