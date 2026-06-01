'use client'

import { useState, useEffect, useCallback } from 'react'

export default function PhotoGallery({ photos, title }: { photos: string[]; title: string }) {
  const [active,   setActive]   = useState(0)
  const [lightbox, setLightbox] = useState(false)
  const [lightboxI, setLightboxI] = useState(0)

  const openLightbox = (i: number) => { setLightboxI(i); setLightbox(true) }
  const closeLightbox = () => setLightbox(false)

  const prev = useCallback(() => setLightboxI(i => (i - 1 + photos.length) % photos.length), [photos.length])
  const next = useCallback(() => setLightboxI(i => (i + 1) % photos.length), [photos.length])

  useEffect(() => {
    if (!lightbox) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft')  prev()
      if (e.key === 'ArrowRight') next()
      if (e.key === 'Escape')     closeLightbox()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [lightbox, prev, next])

  if (photos.length === 0) {
    return (
      <div className="w-full h-72 rounded-2xl bg-gradient-to-br from-brand-primary to-brand-accent mb-6" />
    )
  }

  return (
    <>
      <div className="mb-6">
        {/* Main photo */}
        <button
          onClick={() => openLightbox(active)}
          className="w-full h-72 md:h-96 rounded-2xl overflow-hidden block mb-2 relative cursor-zoom-in"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={photos[active]} alt={title} className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" />
          {photos.length > 1 && (
            <span className="absolute bottom-3 right-3 bg-black/55 backdrop-blur text-white text-xs font-semibold px-2.5 py-1 rounded-full">
              {active + 1} / {photos.length}
            </span>
          )}
        </button>

        {/* Thumbnails */}
        {photos.length > 1 && (
          <div className="flex gap-2 overflow-x-auto">
            {photos.map((url, i) => (
              <button
                key={url}
                onClick={() => setActive(i)}
                className="h-16 w-16 flex-shrink-0 rounded-xl overflow-hidden transition-opacity"
                style={{ border: i === active ? '2px solid #4ECDC4' : '2px solid transparent', opacity: i === active ? 1 : 0.55 }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt={`${title} ${i + 1}`} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div
          onClick={closeLightbox}
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.92)', backdropFilter: 'blur(8px)' }}
        >
          {/* Close */}
          <button
            onClick={closeLightbox}
            className="absolute top-5 right-5 text-white/70 hover:text-white w-10 h-10 rounded-full flex items-center justify-center text-xl"
            style={{ background: 'rgba(255,255,255,0.1)' }}
          >
            ✕
          </button>

          {/* Counter */}
          <span className="absolute top-6 left-1/2 -translate-x-1/2 text-white/60 text-sm font-semibold">
            {lightboxI + 1} / {photos.length}
          </span>

          {/* Prev */}
          {photos.length > 1 && (
            <button
              onClick={e => { e.stopPropagation(); prev() }}
              className="absolute left-5 text-white text-2xl w-12 h-12 rounded-full flex items-center justify-center"
              style={{ background: 'rgba(255,255,255,0.1)' }}
            >
              ‹
            </button>
          )}

          {/* Image */}
          <div onClick={e => e.stopPropagation()} className="max-w-[90vw] max-h-[85vh]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={photos[lightboxI]}
              alt={`${title} — photo ${lightboxI + 1}`}
              className="max-w-[90vw] max-h-[85vh] object-contain rounded-lg"
            />
          </div>

          {/* Next */}
          {photos.length > 1 && (
            <button
              onClick={e => { e.stopPropagation(); next() }}
              className="absolute right-5 text-white text-2xl w-12 h-12 rounded-full flex items-center justify-center"
              style={{ background: 'rgba(255,255,255,0.1)' }}
            >
              ›
            </button>
          )}
        </div>
      )}
    </>
  )
}
