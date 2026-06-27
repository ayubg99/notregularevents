import { Suspense } from 'react'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import ReferralCapture from '@/components/ReferralCapture'

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Suspense fallback={null}>
        <ReferralCapture />
      </Suspense>
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </>
  )
}
