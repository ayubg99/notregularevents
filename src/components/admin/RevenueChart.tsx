'use client'

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from'recharts'

export interface MonthData {
  month: string
  events: number
  trips: number
  memberships: number
}

interface TooltipPayload {
  name: string
  value: number
  color: string
}

function CustomTooltip({ active, payload, label }: {
  active?: boolean
  payload?: TooltipPayload[]
  label?: string
}) {
  if (!active || !payload?.length) return null
  const total = payload.reduce((s, p) => s + p.value, 0)
  return (
    <div className="bg-brand-dark border border-white/15 rounded-xl px-3 py-2.5 text-xs shadow-lg min-w-[130px]">
      <p className="text-white/50 mb-2 font-medium">{label}</p>
      {payload.map(p => (
        <div key={p.name} className="flex justify-between gap-4 mb-0.5">
          <span style={{ color: p.color }}>{p.name}</span>
          <span className="text-white font-semibold">€{p.value.toFixed(2)}</span>
        </div>
      ))}
      <div className="border-t border-white/10 mt-2 pt-1.5 flex justify-between">
        <span className="text-white/40">Total</span>
        <span className="text-white font-bold">€{total.toFixed(2)}</span>
      </div>
    </div>
  )
}

export default function RevenueChart({ data }: { data: MonthData[] }) {
  return (
    <div className="glass-card rounded-2xl p-6">
      <h3 className="font-heading font-bold text-white text-base mb-5">Monthly Revenue — Last 6 Months</h3>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
          <XAxis
            dataKey="month"
            tick={{ fill:'rgba(255,255,255,0.3)', fontSize: 11 }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            tick={{ fill:'rgba(255,255,255,0.3)', fontSize: 10 }}
            tickLine={false}
            axisLine={false}
            tickFormatter={v =>`€${v}`}
            width={50}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill:'rgba(255,255,255,0.03)' }} />
          <Legend
            wrapperStyle={{ fontSize: 11, color:'rgba(255,255,255,0.4)', paddingTop: 12 }}
          />
          <Bar dataKey="events" name="Events" fill="#E91E8C" radius={[3, 3, 0, 0]} maxBarSize={20} />
          <Bar dataKey="trips" name="Trips" fill="#2dd4bf" radius={[3, 3, 0, 0]} maxBarSize={20} />
          <Bar dataKey="memberships" name="Memberships" fill="#8B1A6B" radius={[3, 3, 0, 0]} maxBarSize={20} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
