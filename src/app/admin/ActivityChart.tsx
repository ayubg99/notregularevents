'use client'

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from'recharts'

interface Props {
  data: { date: string; bookings: number }[]
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-GB', { day:'numeric', month:'short' })
}

interface TooltipPayload {
  value: number
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: TooltipPayload[]; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-brand-dark border border-white/15 rounded-xl px-3 py-2 text-xs shadow-lg">
      <p className="text-white/50 mb-0.5">{label ? formatDate(label) :''}</p>
      <p className="text-white font-bold">{payload[0].value} bookings</p>
    </div>
  )
}

export default function ActivityChart({ data }: Props) {
  const displayData = data.map(d => ({ ...d, label: formatDate(d.date) }))

  return (
    <div className="glass-card rounded-2xl p-6">
      <h3 className="font-heading font-bold text-white text-base mb-5">Booking Activity — Last 30 Days</h3>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={displayData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fill:'rgba(255,255,255,0.3)', fontSize: 10 }}
            tickLine={false}
            axisLine={false}
            interval={4}
          />
          <YAxis
            tick={{ fill:'rgba(255,255,255,0.3)', fontSize: 10 }}
            tickLine={false}
            axisLine={false}
            allowDecimals={false}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill:'rgba(255,255,255,0.03)' }} />
          <Bar dataKey="bookings" fill="var(--color-brand-primary, #FF6B00)" radius={[4, 4, 0, 0]} maxBarSize={24} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
