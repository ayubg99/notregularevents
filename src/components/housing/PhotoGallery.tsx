'use client'

import { useState } from 'react'
import { X } from 'lucide-react'

export default function PhotoGallery({ photos, title }: { photos: string[]; title: string }) {
  const [lightbox, setLightbox] = useState<number | null>(null)

  if (photos.length === 0) {
    return (
      <div className="w-full h-72 rounded-2xl bg-gradient-to-br from-brand-primary to-brand-accent mb-6" />
    )
  }

  const main      = photos[0]
  const thumbs    = photos.slice(1, 8)

  return (
    <>
      <div className="mb-6">
        {/* Main photo */}
        <button
          onClick={() => setLightbox(0)}
          className="w-full h-72 md:h-96 rounded-2xl overflow-hidden block mb-2"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={main} alt={title} className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" />
        </button>

        {/* Thumbnails */}
        {thumbs.length > 0 && (
          <div className="grid grid-cols-4 md:grid-cols-7 gap-2">
            {thumbs.map((url, i) => (
              <button
                key={url}
                onClick={() => setLightbox(i + 1)}
                className="h-16 rounded-xl overflow-hidden"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt={`${title} ${i + 2}`} className="w-full h-full object-cover hover:opacity-80 transition-opacity" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightbox !== null && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setLightbox(null)}
        >
          <button
            onClick={() => setLightbox(null)}
            className="absolute top-4 right-4 text-white/70 hover:text-white"
          >
            <X size={28} />
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={photos[lightbox]}
            alt={title}
            className="max-w-full max-h-full rounded-xl object-contain"
            onClick={e => e.stopPropagation()}
          />
          {photos.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
              {photos.map((_, i) => (
                <button
                  key={i}
                  onClick={e => { e.stopPropagation(); setLightbox(i) }}
                  className={`w-2 h-2 rounded-full transition-colors ${i === lightbox ? 'bg-white' : 'bg-white/30'}`}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </>
  )
}
