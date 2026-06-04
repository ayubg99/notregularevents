'use client'

import { useState, useEffect, useCallback } from'react'

interface Props {
  photos: string[]
  title: string
  catEmoji: string
}

export default function PhotoGallery({ photos, title, catEmoji }: Props) {
  const [active, setActive] = useState(0)
  const [lightbox, setLightbox] = useState(false)
  const [lightboxI, setLightboxI] = useState(0)

  const openLightbox = (i: number) => { setLightboxI(i); setLightbox(true) }
  const closeLightbox = () => setLightbox(false)

  const prev = useCallback(() => setLightboxI(i => (i - 1 + photos.length) % photos.length), [photos.length])
  const next = useCallback(() => setLightboxI(i => (i + 1) % photos.length), [photos.length])

  useEffect(() => {
    if (!lightbox) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key ==='ArrowLeft') prev()
      if (e.key ==='ArrowRight') next()
      if (e.key ==='Escape') closeLightbox()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [lightbox, prev, next])

  if (photos.length === 0) {
    return (
      <div style={{
        borderRadius:'16px', overflow:'hidden', marginBottom:'20px',
        background:'linear-gradient(135deg, #4ECDC4, #2ECC71)',
        height:'340px', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'80px',
      }}>
        {catEmoji}
      </div>
    )
  }

  return (
    <>
      <div style={{ marginBottom:'20px' }}>
        {/* Main photo — click to open lightbox */}
        <div
          onClick={() => openLightbox(active)}
          style={{
            borderRadius:'16px', overflow:'hidden', marginBottom:'10px',
            background:'#111', height:'340px',
            display:'flex', alignItems:'center', justifyContent:'center',
            cursor:'zoom-in', position:'relative',
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={photos[active]} alt={title} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
          {photos.length > 1 && (
            <span style={{
              position:'absolute', bottom:'12px', right:'12px',
              background:'rgba(0,0,0,0.55)', backdropFilter:'blur(6px)',
              color:'#fff', fontSize:'12px', fontWeight: 600,
              padding:'4px 10px', borderRadius:'20px',
            }}>
              {active + 1} / {photos.length}
            </span>
          )}
        </div>

        {/* Thumbnails */}
        {photos.length > 1 && (
          <div style={{ display:'flex', gap:'8px', overflowX:'auto' }}>
            {photos.map((photo, i) => (
              <button
                key={i}
                onClick={() => setActive(i)}
                style={{
                  width:'72px', height:'72px', flexShrink: 0,
                  borderRadius:'8px', overflow:'hidden',
                  border: i === active ?'2px solid #4ECDC4' :'2px solid transparent',
                  padding: 0, cursor:'pointer',
                  opacity: i === active ? 1 : 0.55,
                  transition:'opacity 0.15s, border 0.15s',
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={photo} alt={`Photo ${i + 1}`} style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }} />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div
          onClick={closeLightbox}
          style={{
            position:'fixed', inset: 0, zIndex: 1000,
            background:'rgba(0,0,0,0.92)', backdropFilter:'blur(8px)',
            display:'flex', alignItems:'center', justifyContent:'center',
          }}
        >
          {/* Close */}
          <button
            onClick={closeLightbox}
            style={{
              position:'absolute', top:'20px', right:'20px',
              background:'rgba(255,255,255,0.1)', border:'none',
              color:'#fff', fontSize:'20px', width:'40px', height:'40px',
              borderRadius:'50%', cursor:'pointer', display:'flex',
              alignItems:'center', justifyContent:'center',
            }}
          >
            
          </button>

          {/* Counter */}
          <span style={{
            position:'absolute', top:'24px', left:'50%', transform:'translateX(-50%)',
            color:'rgba(255,255,255,0.6)', fontSize:'13px', fontWeight: 600,
          }}>
            {lightboxI + 1} / {photos.length}
          </span>

          {/* Prev */}
          {photos.length > 1 && (
            <button
              onClick={e => { e.stopPropagation(); prev() }}
              style={{
                position:'absolute', left:'20px',
                background:'rgba(255,255,255,0.1)', border:'none',
                color:'#fff', fontSize:'22px', width:'48px', height:'48px',
                borderRadius:'50%', cursor:'pointer', display:'flex',
                alignItems:'center', justifyContent:'center',
              }}
            >
              ‹
            </button>
          )}

          {/* Image */}
          <div onClick={e => e.stopPropagation()} style={{ maxWidth:'90vw', maxHeight:'85vh' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={photos[lightboxI]}
              alt={`${title} — photo ${lightboxI + 1}`}
              style={{ maxWidth:'90vw', maxHeight:'85vh', objectFit:'contain', borderRadius:'8px' }}
            />
          </div>

          {/* Next */}
          {photos.length > 1 && (
            <button
              onClick={e => { e.stopPropagation(); next() }}
              style={{
                position:'absolute', right:'20px',
                background:'rgba(255,255,255,0.1)', border:'none',
                color:'#fff', fontSize:'22px', width:'48px', height:'48px',
                borderRadius:'50%', cursor:'pointer', display:'flex',
                alignItems:'center', justifyContent:'center',
              }}
            >
              ›
          </button>
          )}
        </div>
      )}
    </>
  )
}
