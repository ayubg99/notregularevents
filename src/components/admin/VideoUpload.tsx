'use client'

import { useState, useRef } from 'react'
import { Upload, X, Loader2, Video } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface Props {
  value:    string
  onChange: (url: string) => void
}

export default function VideoUpload({ value, onChange }: Props) {
  const [uploading, setUploading] = useState(false)
  const [progress,  setProgress]  = useState(0)
  const [error,     setError]     = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleFile(file: File) {
    if (!file.type.startsWith('video/')) {
      setError('Please select a video file')
      return
    }
    if (file.size > 100 * 1024 * 1024) {
      setError('Video must be under 100 MB')
      return
    }

    setError('')
    setUploading(true)
    setProgress(0)

    try {
      const supabase = createClient()
      const ext  = file.name.split('.').pop() ?? 'mp4'
      const name = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

      const { error: uploadError } = await supabase.storage
        .from('recap-media')
        .upload(name, file, { upsert: false })

      if (uploadError) throw uploadError

      const { data } = supabase.storage.from('recap-media').getPublicUrl(name)
      onChange(data.publicUrl)
      setProgress(100)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="flex flex-col gap-2">
      {value ? (
        <div className="relative rounded-xl overflow-hidden border border-white/10 bg-white/5" style={{ aspectRatio: '9/14', maxWidth: '200px' }}>
          <video
            src={value}
            muted
            loop
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />
          <button
            type="button"
            onClick={() => onChange('')}
            className="absolute top-2 right-2 p-1.5 rounded-full bg-black/70 text-white hover:bg-black/90 transition-colors"
            title="Remove video"
          >
            <X size={13} />
          </button>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="absolute bottom-2 right-2 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-black/70 text-white/80 hover:text-white hover:bg-black/90 text-xs font-medium transition-colors disabled:opacity-50"
          >
            <Upload size={11} />
            Replace
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="flex flex-col items-center justify-center gap-2.5 h-36 rounded-xl border border-dashed border-white/20 hover:border-brand-primary/50 bg-white/3 hover:bg-white/5 transition-all text-white/40 hover:text-white/70 disabled:pointer-events-none"
        >
          {uploading ? (
            <>
              <Loader2 size={22} className="animate-spin text-brand-primary" />
              <span className="text-xs">Uploading… {progress > 0 ? `${progress}%` : ''}</span>
            </>
          ) : (
            <>
              <Video size={22} />
              <span className="text-xs font-medium">Click to upload video</span>
              <span className="text-[11px] opacity-50">MP4, MOV, WebM · max 100 MB</span>
            </>
          )}
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="video/*"
        className="hidden"
        onChange={e => {
          const file = e.target.files?.[0]
          if (file) handleFile(file)
          e.target.value = ''
        }}
      />

      {error && <p className="text-red-400 text-xs">{error}</p>}
    </div>
  )
}
