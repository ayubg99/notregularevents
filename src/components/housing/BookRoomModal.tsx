'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { X } from 'lucide-react'
import type { PartnerRoomRow } from '@/types/database'

const NATIONALITIES = [
  'Afghan','Albanian','Algerian','American','Andorran','Angolan','Argentine','Armenian',
  'Australian','Austrian','Azerbaijani','Bahraini','Bangladeshi','Belarusian','Belgian',
  'Bolivian','Bosnian','Brazilian','British','Bulgarian','Cambodian','Cameroonian',
  'Canadian','Chilean','Chinese','Colombian','Congolese','Croatian','Cuban','Czech',
  'Danish','Dominican','Dutch','Ecuadorian','Egyptian','Eritrean','Estonian','Ethiopian',
  'Filipino','Finnish','French','Georgian','German','Ghanaian','Greek','Guatemalan',
  'Haitian','Honduran','Hungarian','Indian','Indonesian','Iranian','Iraqi','Irish',
  'Italian','Ivorian','Jamaican','Japanese','Jordanian','Kazakh','Kenyan',
  'Korean','Kosovan','Kuwaiti','Kyrgyz','Latvian','Lebanese','Libyan','Lithuanian',
  'Luxembourgish','Macedonian','Malaysian','Malian','Maltese','Mexican','Moldovan',
  'Moroccan','Mozambican','Myanmar (Burmese)','Namibian','Nepali','New Zealander',
  'Nicaraguan','Nigerian','Norwegian','Omani','Pakistani','Palestinian','Panamanian',
  'Paraguayan','Peruvian','Polish','Portuguese','Puerto Rican','Qatari','Romanian',
  'Russian','Saudi','Senegalese','Serbian','Singaporean','Slovak','Slovenian',
  'Somali','South African','Spanish','Sri Lankan','Sudanese','Swedish','Swiss',
  'Syrian','Taiwanese','Tajik','Tanzanian','Thai','Tunisian','Turkish','Ugandan',
  'Ukrainian','Emirati','Uruguayan','Uzbek','Venezuelan','Vietnamese','Yemeni',
  'Zambian','Zimbabwean',
]

interface Props {
  room: PartnerRoomRow
  open: boolean
  onClose: () => void
}

export default function BookRoomModal({ room, open, onClose }: Props) {
  const t = useTranslations('housing')
  const [form, setForm] = useState({
    guestName:    '',
    guestEmail:   '',
    guestPhone:   '',
    nationality:  '',
    university:   '',
    moveInDate:   '',
    duration:     3,
    message:      '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  if (!open) return null

  const DURATION_OPTIONS = [
    { value: 1,   label: t('duration1Month')  },
    { value: 3,   label: t('duration3Months') },
    { value: 6,   label: t('durationSemester') },
    { value: 12,  label: t('durationYear')    },
  ]

  function set(field: string, value: string | number) {
    setForm(f => ({ ...f, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!form.guestName || !form.guestEmail || !form.guestPhone || !form.nationality || !form.university || !form.moveInDate) {
      setError(t('errorRequiredFields'))
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/housing/book-room', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId:      room.id,
          guestName:   form.guestName,
          guestEmail:  form.guestEmail,
          guestPhone:  form.guestPhone,
          nationality: form.nationality,
          university:  form.university,
          moveInDate:  form.moveInDate,
          duration:    form.duration,
          message:     form.message,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to create checkout')
      window.location.href = data.url
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setLoading(false)
    }
  }

  const inputClass = 'w-full px-3 py-2.5 rounded-xl border border-white/10 bg-white/5 text-white placeholder:text-white/25 text-sm focus:outline-none focus:border-brand-primary/50 transition-colors'
  const labelClass = 'text-white/50 text-xs mb-1.5 block'

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="glass-card rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-white font-bold text-lg">{t('reserveThisRoom')}</h2>
            <p className="text-white/50 text-sm">{room.title}</p>
          </div>
          <button onClick={onClose} className="text-white/40 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>{t('labelFullNameRequired')}</label>
              <input
                className={inputClass}
                placeholder="Your full name"
                value={form.guestName}
                onChange={e => set('guestName', e.target.value)}
              />
            </div>
            <div>
              <label className={labelClass}>{t('labelEmailRequired')}</label>
              <input
                type="email"
                className={inputClass}
                placeholder="your@email.com"
                value={form.guestEmail}
                onChange={e => set('guestEmail', e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>{t('labelWhatsapp')}</label>
              <input
                className={inputClass}
                placeholder="+34 600 000 000"
                value={form.guestPhone}
                onChange={e => set('guestPhone', e.target.value)}
              />
            </div>
            <div>
              <label className={labelClass}>{t('labelNationalityRequired')}</label>
              <select
                className={inputClass}
                value={form.nationality}
                onChange={e => set('nationality', e.target.value)}
              >
                <option value="">{t('selectNationalityPlaceholder')}</option>
                {NATIONALITIES.map(n => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className={labelClass}>{t('labelUniversity')}</label>
            <input
              className={inputClass}
              placeholder="e.g. Universitat de València"
              value={form.university}
              onChange={e => set('university', e.target.value)}
            />
          </div>

          <div>
            <label className={labelClass}>{t('labelMoveIn')}</label>
            <input
              type="date"
              className={inputClass}
              value={form.moveInDate}
              onChange={e => set('moveInDate', e.target.value)}
            />
          </div>

          <div>
            <label className={labelClass}>{t('labelDuration')}</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {DURATION_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => set('duration', opt.value)}
                  className={`py-2 px-2 rounded-xl text-xs font-medium border transition-colors ${
                    form.duration === opt.value
                      ? 'border-brand-primary bg-brand-primary/15 text-brand-primary'
                      : 'border-white/10 bg-white/5 text-white/60 hover:border-white/25'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className={labelClass}>{t('labelMessage')}</label>
            <textarea
              className={`${inputClass} resize-none`}
              rows={3}
              placeholder={`Hi! I'm ${form.guestName || 'your name'} from ${form.nationality || 'your country'}...`}
              value={form.message}
              onChange={e => set('message', e.target.value)}
            />
          </div>

          {/* Payment summary */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-2">
            <p className="text-white/70 text-sm font-medium">{t('youPayNow')}</p>
            <div className="flex justify-between text-sm">
              <span className="text-white/50">{t('platformFee')}</span>
              <span className="text-white font-bold">€{room.platform_fee}</span>
            </div>
            <p className="text-white/40 text-xs border-t border-white/10 pt-2">
              {t('rentDepositNote', { rent: room.monthly_rent, deposit: room.deposit_amount })}
            </p>
          </div>

          {error && (
            <p className="text-red-400 text-sm">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full py-3 rounded-xl font-semibold text-sm disabled:opacity-50"
          >
            {loading ? t('redirectingPayment') : t('payAndReserve', { fee: room.platform_fee })}
          </button>
        </form>
      </div>
    </div>
  )
}
