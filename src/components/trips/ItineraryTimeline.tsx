import type { ItineraryDay } from '@/types/database'

interface Props {
  itinerary: ItineraryDay[] | null
}

export default function ItineraryTimeline({ itinerary }: Props) {
  if (!itinerary || itinerary.length === 0) {
    return (
      <p className="text-white/40 text-sm italic">
        Itinerary will be published soon.
      </p>
    )
  }

  const sorted = [...itinerary].sort((a, b) => a.day - b.day)

  return (
    <ol className="relative flex flex-col gap-0 pl-8">
      {sorted.map((item, idx) => (
        <li key={item.day} className="relative pb-8 last:pb-0">
          {/* Vertical line */}
          {idx < sorted.length - 1 && (
            <span className="absolute left-[-1.375rem] top-7 bottom-0 w-px bg-white/10" />
          )}

          {/* Day circle */}
          <span className="absolute left-[-2rem] top-0.5 flex items-center justify-center w-7 h-7 rounded-full bg-brand-primary/20 border border-brand-primary/40 text-brand-primary text-xs font-bold">
            {item.day}
          </span>

          <h4 className="font-heading font-semibold text-white text-sm leading-snug mb-1">
            Day {item.day}: {item.title}
          </h4>
          <p className="text-white/60 text-sm leading-relaxed">{item.description}</p>
        </li>
      ))}
    </ol>
  )
}
