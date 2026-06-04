'use client'

import { useState } from'react'
import { Check, X } from'lucide-react'
import type { TripRow, ReviewRow } from'@/types/database'
import ItineraryTimeline from'@/components/trips/ItineraryTimeline'
import ReviewsSection from'@/components/events/ReviewsSection'

const TABS = ['Overview','Itinerary','Included','Meeting Points','Reviews'] as const
type Tab = typeof TABS[number]

interface Props {
  trip: TripRow
  reviews: ReviewRow[]
  isAuthenticated: boolean
}

export default function TripTabs({ trip, reviews, isAuthenticated }: Props) {
  const [active, setActive] = useState<Tab>('Overview')

  return (
    <div>
      {/* Tab bar */}
      <div className="flex gap-1 overflow-x-auto scrollbar-hide border-b border-white/10 mb-8">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActive(tab)}
            className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-colors border-b-2 -mb-px ${
              active === tab
                ?'text-brand-primary border-brand-primary'
                :'text-white/50 border-transparent hover:text-white/80'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {active ==='Overview' && (
        <div className="flex flex-col gap-6">
          {trip.description ? (
            <div>
              <h2 className="font-heading text-xl font-bold text-white mb-4">About this trip</h2>
              <p className="text-white/70 leading-relaxed whitespace-pre-wrap text-sm md:text-base">
                {trip.description}
              </p>
            </div>
          ) : (
            <p className="text-white/40 text-sm italic">Trip details coming soon.</p>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label:'Destination', value: trip.destination },
              {
                label:'Duration',
                value: (() => {
                  const days = Math.round(
                    (new Date(trip.end_date).getTime() - new Date(trip.start_date).getTime()) / 86_400_000,
                  )
                  return`${days} day${days === 1 ?'' :'s'}`
                })(),
              },
              {
                label:'Capacity',
                value:`${trip.capacity} people`,
              },
              {
                label:'From',
                value:`€${Math.min(
                  ...[trip.price_early_bird, trip.price_standard, trip.price_vip, trip.price_group]
                    .filter((p): p is number => p != null),
                )}`,
              },
            ].map(({ label, value }) => (
              <div key={label} className="glass-card rounded-xl p-4 text-center">
                <p className="text-white/40 text-xs uppercase tracking-wide mb-1">{label}</p>
                <p className="text-white font-semibold text-sm">{value}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {active ==='Itinerary' && (
        <div>
          <h2 className="font-heading text-xl font-bold text-white mb-6">Day by Day</h2>
          <ItineraryTimeline itinerary={trip.itinerary} />
        </div>
      )}

      {active ==='Included' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
          <div>
            <h3 className="font-heading font-bold text-white mb-4 flex items-center gap-2">
              <Check size={16} className="text-green-400" />
              What&apos;s Included
            </h3>
            {trip.whats_included && trip.whats_included.length > 0 ? (
              <ul className="flex flex-col gap-2.5">
                {trip.whats_included.map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-sm text-white/70">
                    <Check size={14} className="text-green-400 flex-shrink-0 mt-0.5" />
                    {item}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-white/40 text-sm italic">Details coming soon.</p>
            )}
          </div>

          <div>
            <h3 className="font-heading font-bold text-white mb-4 flex items-center gap-2">
              <X size={16} className="text-red-400" />
              Not Included
            </h3>
            {trip.whats_excluded && trip.whats_excluded.length > 0 ? (
              <ul className="flex flex-col gap-2.5">
                {trip.whats_excluded.map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-sm text-white/70">
                    <X size={14} className="text-red-400 flex-shrink-0 mt-0.5" />
                    {item}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-white/40 text-sm italic">Details coming soon.</p>
            )}
          </div>
        </div>
      )}

      {active ==='Meeting Points' && (
        <div>
          <h2 className="font-heading text-xl font-bold text-white mb-6">Meeting Points</h2>
          {trip.meeting_points && trip.meeting_points.length > 0 ? (
            <ul className="flex flex-col gap-3">
              {trip.meeting_points.map((point, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-white/70">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-brand-primary/20 border border-brand-primary/30 text-brand-primary text-xs font-bold flex items-center justify-center">
                    {i + 1}
                  </span>
                  {point}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-white/40 text-sm italic">Meeting point details will be shared closer to the trip date.</p>
          )}
        </div>
      )}

      {active ==='Reviews' && (
        <ReviewsSection
          targetId={trip.id}
          targetType="trip"
          initialReviews={reviews}
          isAuthenticated={isAuthenticated}
        />
      )}
    </div>
  )
}
