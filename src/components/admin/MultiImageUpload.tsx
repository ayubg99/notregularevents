'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'
import { Upload, X, Loader2, ImageIcon } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface Props {
  value:    string[]
  onChange: (urls: string[]) => void
  folder:   'events' | 'trips' | 'sponsors' | 'jobs'
  max?:     number
}

export default function MultiImageUpload({ value, onChange, folder, max = 8 }: Props) {
  const [uploading, setUploading] = useState(false)
  const [error,     setError]     = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleFiles(files: FileList) {
    const remaining = max - value.length
    if (remaining <= 0) {
      setError(`Maximum ${max} photos allowed`)
      return
    }
    const toUpload = Array.from(files).slice(0, remaining)

    for (const file of toUpload) {
      if (!file.type.startsWith('image/')) {
        setError('Only image files are allowed')
        return
      }
      if (file.size > 8 * 1024 * 1024) {
        setError('Each image must be under 8 MB')
        return
      }
    }

    setError('')
    setUploading(true)

    try {
      const supabase = createClient()
      const urls: string[] = []

      for (const file of toUpload) {
        const ext  = file.name.split('.').pop() ?? 'jpg'
        const name = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
        const path = `${folder}/${name}`

        const { error: uploadError } = await supabase.storage
          .from('images')
          .upload(path, file, { upsert: false })

        if (uploadError) throw uploadError

        const { data } = supabase.storage.from('images').getPublicUrl(path)
        urls.push(data.publicUrl)
      }

      onChange([...value, ...urls])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  function remove(url: string) {
    onChange(value.filter(u => u !== url))
  }

  return (
    <div className="flex flex-col gap-3">
      {value.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {value.map(url => (
            <div key={url} className="relative aspect-video rounded-xl overflow-hidden border border-white/10 bg-white/5">
              <Image src={url} alt="Gallery photo" fill className="object-cover" unoptimized />
              <button
                type="button"
                onClick={() => remove(url)}
                className="absolute top-1.5 right-1.5 p-1 rounded-full bg-black/70 text-white hover:bg-black/90 transition-colors"
              >
                <X size={11} />
              </button>
            </div>
          ))}
        </div>
      )}

      {value.length < max && (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="flex items-center justify-center gap-2 h-12 rounded-xl border border-dashed border-white/20 hover:border-brand-primary/50 bg-white/3 hover:bg-white/5 transition-all text-white/40 hover:text-white/70 text-xs font-medium disabled:pointer-events-none"
        >
          {uploading ? (
            <>
              <Loader2 size={14} className="animate-spin text-brand-primary" />
              Uploading…
            </>
          ) : (
            <>
              <ImageIcon size={14} />
              Add photos
              <span className="text-white/25">({value.length}/{max})</span>
            </>
          )}
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={e => {
          if (e.target.files?.length) handleFiles(e.target.files)
          e.target.value = ''
        }}
      />

      {error && <p className="text-red-400 text-xs">{error}</p>}
    </div>
  )
}
