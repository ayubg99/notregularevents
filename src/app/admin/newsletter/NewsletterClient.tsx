'use client'

import { useState, useTransition } from'react'
import { Mail, Download, Send, Users } from'lucide-react'
import { triggerWeeklyDigest } from'./actions'

interface Subscriber {
  id: string
  email: string
  subscribed_at: string
}

interface Props {
  subscribers: Subscriber[]
}

export default function NewsletterClient({ subscribers }: Props) {
  const [sendResult, setSendResult] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function exportCsv() {
    const rows = ['email,subscribed_at', ...subscribers.map(s =>
`${s.email},${new Date(s.subscribed_at).toISOString()}`
    )]
    const blob = new Blob([rows.join('\n')], { type:'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download =`newsletter-subscribers-${new Date().toISOString().slice(0,10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  function handleSend() {
    setSendResult(null)
    startTransition(async () => {
      const result = await triggerWeeklyDigest()
      if (result.skipped) {
        setSendResult(`Skipped — ${result.reason ??'no content this week'}`)
      } else if (result.sent === 0) {
        setSendResult(result.reason ??'No subscribers to send to')
      } else {
        setSendResult(` Sent to ${result.sent} subscriber${result.sent === 1 ?'' :'s'}`)
      }
    })
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-heading text-2xl font-bold text-white mb-1">Newsletter</h1>
          <p className="text-white/40 text-sm">Manage subscribers and send weekly digests.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={exportCsv}
            disabled={subscribers.length === 0}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border border-white/10 text-white/60 hover:text-white hover:bg-white/5 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <Download size={14} />
            Export CSV
          </button>
          <button
            onClick={handleSend}
            disabled={isPending}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-orange-500/20 text-orange-400 border border-orange-400/25 hover:bg-amber-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPending ? (
              <span className="w-3.5 h-3.5 border-2 border-amber-400/40 border-t-amber-400 rounded-full animate-spin" />
            ) : (
              <Send size={14} />
            )}
            {isPending ?'Sending…' :"Send this week's digest"}
          </button>
        </div>
      </div>

      {sendResult && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-sm text-white/70">
          <Mail size={14} className="text-orange-400 flex-shrink-0" />
          {sendResult}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-card rounded-2xl p-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-orange-500/15 flex items-center justify-center">
            <Users size={18} className="text-orange-400" />
          </div>
          <div>
            <p className="text-white/40 text-xs">Total Subscribers</p>
            <p className="text-white text-2xl font-bold">{subscribers.length}</p>
          </div>
        </div>
      </div>

      {/* Subscribers table */}
      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-white/8">
          <h2 className="font-heading font-semibold text-white text-sm">Subscribers</h2>
        </div>

        {subscribers.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <Mail size={32} className="text-white/20 mx-auto mb-3" />
            <p className="text-white/30 text-sm">No subscribers yet.</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/8">
                <th className="px-6 py-3 text-left text-xs font-semibold text-white/40 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-white/40 uppercase tracking-wider">Subscribed</th>
              </tr>
            </thead>
            <tbody>
              {subscribers.map((sub, i) => (
                <tr key={sub.id} className={`border-b border-white/5 ${i % 2 === 0 ?'' :'bg-white/[0.02]'}`}>
                  <td className="px-6 py-3.5 text-sm text-white/80">{sub.email}</td>
                  <td className="px-6 py-3.5 text-sm text-white/40 text-right whitespace-nowrap">
                    {new Date(sub.subscribed_at).toLocaleDateString('en-GB', {
                      day:'numeric', month:'short', year:'numeric',
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
