import Link from'next/link'
import type { ReactNode } from'react'

export default function EmployerLayout({ children }: { children: ReactNode }) {
  return (
    <div style={{ minHeight:'100vh', background:'#0F0900', color:'#fff', fontFamily:'Inter, sans-serif' }}>
      {/* Employer Navbar */}
      <nav style={{
        background:'rgba(15,9,0,0.95)',
        backdropFilter:'blur(20px)',
        borderBottom:'1px solid rgba(255,255,255,0.06)',
        padding:'0 24px',
        height:'64px',
        display:'flex',
        alignItems:'center',
        justifyContent:'space-between',
        position:'sticky',
        top: 0,
        zIndex: 100,
      }}>
        {/* Logo */}
        <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
          <img src="/logo-circle.png" width={36} height={36} alt="Erasmus Life" style={{ borderRadius:'50%' }} />
          <div>
            <p style={{ color:'#fff', fontWeight: 700, fontSize:'14px', margin: 0, lineHeight: 1 }}>
              Erasmus Life
            </p>
            <p style={{ color:'#FF6B00', fontSize:'11px', margin: 0, fontWeight: 600 }}>
              Employer Portal
            </p>
          </div>
        </div>

        {/* Nav links */}
        <div style={{ display:'flex', alignItems:'center', gap:'20px' }}>
          <Link href="/jobs" style={{ color:'#888', textDecoration:'none', fontSize:'14px' }}>Browse Jobs</Link>
          <Link href="/" style={{ color:'#888', textDecoration:'none', fontSize:'14px' }}>← Back to site</Link>
        </div>
      </nav>

      {/* Page content */}
      <div style={{ maxWidth:'900px', margin:'0 auto', padding:'40px 20px' }}>
        {children}
      </div>
    </div>
  )
}
