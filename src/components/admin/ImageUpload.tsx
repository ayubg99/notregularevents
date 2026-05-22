'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'
import { Upload, X, Loader2, ImageIcon } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface Props {
  value:    string
  onChange: (url: string) => void
  folder:   'events' | 'trips'
}

export default function ImageUpload({ value, onChange, folder }: Props) {
  const [uploading, setUploading] = useState(false)
  const [error,     setError]     = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleFile(file: File) {
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file')
      return
    }
    if (file.size > 8 * 1024 * 1024) {
      setError('Image must be under 8 MB')
      return
    }

    setError('')
    setUploading(true)

    try {
      const supabase = createClient()
      const ext  = file.name.split('.').pop() ?? 'jpg'
      const name = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
      const path = `${folder}/${name}`

      const { error: uploadError } = await supabase.storage
        .from('images')
        .upload(path, file, { upsert: false })

      if (uploadError) throw uploadError

      const { data } = supabase.storage.from('images').getPublicUrl(path)
      onChange(data.publicUrl)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="flex flex-col gap-2">
      {value ? (
        <div className="relative rounded-xl overflow-hidden border border-white/10 aspect-video bg-white/5">
          <Image src={value} alt="Preview" fill className="object-cover" unoptimized />
          <button
            type="button"
            onClick={() => onChange('')}
            className="absolute top-2 right-2 p-1.5 rounded-full bg-black/70 text-white hover:bg-black/90 transition-colors"
            title="Remove image"
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
              <span className="text-xs">Uploading…</span>
            </>
          ) : (
            <>
              <ImageIcon size={22} />
              <span className="text-xs font-medium">Click to upload image</span>
              <span className="text-[11px] opacity-50">JPG, PNG, WebP · max 8 MB</span>
            </>
          )}
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
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
