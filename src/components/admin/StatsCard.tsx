interface Props {
  label: string
  value: string | number
  delta?: string
  icon: React.ReactNode
  color?: string
}

export default function StatsCard({ label, value, delta, icon, color ='bg-brand-primary/15' }: Props) {
  return (
    <div className="glass-card rounded-2xl p-6 flex items-start gap-4">
      <div className={`flex-shrink-0 w-11 h-11 rounded-xl ${color} flex items-center justify-center text-white`}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-white/40 text-xs font-medium uppercase tracking-wider mb-1">{label}</p>
        <p className="font-heading text-2xl font-bold text-white">{value}</p>
        {delta && (
          <p className="text-xs mt-1 text-green-400 font-medium">{delta}</p>
        )}
      </div>
    </div>
  )
}
