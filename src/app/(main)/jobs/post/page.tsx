import type { Metadata } from 'next'
import PostJobClient from '@/components/jobs/PostJobClient'

export const metadata: Metadata = {
  title: 'Post a Job | Erasmus Vibe',
  description: 'Reach international students and young professionals in Valencia. Post your job for free or feature it.',
}

export default function PostJobPage() {
  return (
    <main className="min-h-screen pt-24 pb-28 px-4">
      <div className="max-w-3xl mx-auto">

        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">
            Post a Job 💼
          </h1>
          <p className="text-white/60 text-base max-w-lg mx-auto">
            Reach international students and professionals in Valencia. Free listings are active for 30 days.
          </p>
        </div>

        <PostJobClient />
      </div>
    </main>
  )
}
