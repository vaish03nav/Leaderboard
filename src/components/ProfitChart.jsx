import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
} from 'recharts'
import { formatINR } from '../lib/format'

function dayLabel(iso) {
  return new Date(iso).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
  })
}

// Tooltip shows the viewed user's profit at that point.
function ChartTooltip({ active, payload, selectedId, selectedName }) {
  if (!active || !payload?.length) return null
  const point = payload[0].payload
  const value = point[selectedId] ?? 0
  return (
    <div className="rounded-lg bg-slate-800 px-3 py-2 text-sm ring-1 ring-slate-700">
      <p
        className={`font-medium ${value >= 0 ? 'text-emerald-400' : 'text-red-400'}`}
      >
        {selectedName}: {formatINR(value)}
      </p>
      <p className="text-xs text-slate-400">{dayLabel(point.date)}</p>
    </div>
  )
}

export default function ProfitChart({ data, profiles, selectedId }) {
  if (data.length === 0)
    return (
      <p className="text-slate-500">
        No settled bets yet — profit appears here once bets are settled.
      </p>
    )

  const selectedName =
    profiles.find((p) => p.id === selectedId)?.display_name ?? 'You'
  const others = profiles.filter((p) => p.id !== selectedId)

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
          <ReferenceLine y={0} stroke="#334155" />
          <Tooltip
            content={
              <ChartTooltip
                selectedId={selectedId}
                selectedName={selectedName}
              />
            }
          />

          {/* Other users — faint background lines for comparison */}
          {others.map((p) => (
            <Line
              key={p.id}
              type="monotone"
              dataKey={p.id}
              stroke="#475569"
              strokeWidth={1}
              strokeOpacity={0.4}
              dot={false}
              isAnimationActive={false}
              connectNulls
            />
          ))}

          {/* Viewed user — prominent */}
          <Line
            type="monotone"
            dataKey={selectedId}
            stroke="#34d399"
            strokeWidth={2.5}
            dot={{ r: 2.5, fill: '#34d399' }}
            activeDot={{ r: 5 }}
            isAnimationActive={false}
            connectNulls
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
