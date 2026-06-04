'use client'

import { useState, useMemo } from 'react'
import * as LucideIcons from 'lucide-react'
import { Store } from 'lucide-react'
import { CATEGORIES, CONDITIONS } from '@/lib/marketplace'
import ListingCard from './ListingCard'
import type { MarketplaceListingRow } from '@/types/database'

function CatIcon({ name, size = 20, color }: { name: string; size?: number; color?: string }) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const Icon = (LucideIcons as any)[name] as React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }> | undefined
  if (!Icon) return null
  return <Icon size={size} color={color} strokeWidth={1.5} />
}

interface Props {
  initialListings: MarketplaceListingRow[]
}

const btnBase: React.CSSProperties = {
  background:   'rgba(255,255,255,0.03)',
  border:       '1px solid rgba(255,255,255,0.08)',
  borderRadius: '12px',
  padding:      '12px 8px',
  cursor:       'pointer',
  textAlign:    'center',
  transition:   'all 0.2s',
}

const selectStyle: React.CSSProperties = {
  padding:    '10px 16px',
  background: 'rgba(255,255,255,0.05)',
  border:     '1px solid rgba(255,255,255,0.1)',
  borderRadius: '50px',
  color:      '#888',
  fontSize:   '14px',
}

export default function MarketplaceClient({ initialListings }: Props) {
  const [category,  setCategory]  = useState('all')
  const [search,    setSearch]    = useState('')
  const [maxPrice,  setMaxPrice]  = useState('')
  const [condition, setCondition] = useState('')
  const [sortBy,    setSortBy]    = useState('newest')

  const filtered = useMemo(() => {
    let items = [...initialListings]
    if (category !== 'all')   items = items.filter(l => l.category  === category)
    if (search)                items = items.filter(l =>
      l.title.toLowerCase().includes(search.toLowerCase()) ||
      (l.description ?? '').toLowerCase().includes(search.toLowerCase()) ||
      (l.brand ?? '').toLowerCase().includes(search.toLowerCase())
    )
    if (maxPrice)              items = items.filter(l => l.is_free || l.price <= Number(maxPrice))
    if (condition)             items = items.filter(l => l.condition === condition)

    if (sortBy === 'price_asc')  items.sort((a, b) => (a.is_free ? 0 : a.price) - (b.is_free ? 0 : b.price))
    if (sortBy === 'price_desc') items.sort((a, b) => (b.is_free ? 0 : b.price) - (a.is_free ? 0 : a.price))
    // 'newest' is default order from server

    return items
  }, [initialListings, category, search, maxPrice, condition, sortBy])

  return (
    <div>
      {/* Category grid */}
      <div style={{
        display:             'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))',
        gap:                 '6px',
        marginBottom:        '24px',
      }}>
        {/* All */}
        <button
          onClick={() => setCategory('all')}
          style={{
            ...btnBase,
            background: category === 'all' ? '#FF6B00' : btnBase.background,
            border:     category === 'all' ? 'none'    : btnBase.border,
            display:    'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap:        '6px',
            padding:    '12px 6px',
          }}
        >
          <Store size={20} color={category === 'all' ? '#1A1A0E' : '#666'} strokeWidth={1.5} />
          <span style={{
            color:      category === 'all' ? '#1A1A0E' : '#666',
            fontSize:   '10px',
            fontWeight: 600,
            lineHeight: 1.2,
          }}>
            All
          </span>
        </button>

        {CATEGORIES.map(cat => (
          <button
            key={cat.id}
            onClick={() => setCategory(cat.id)}
            style={{
              ...btnBase,
              background:    category === cat.id ? '#FF6B00' : btnBase.background,
              border:        category === cat.id ? 'none'    : btnBase.border,
              display:       'flex',
              flexDirection: 'column',
              alignItems:    'center',
              gap:           '6px',
              padding:       '12px 6px',
            }}
          >
            <CatIcon name={cat.icon} size={20} color={category === cat.id ? '#1A1A0E' : '#666'} />
            <span style={{
              color:      category === cat.id ? '#1A1A0E' : '#666',
              fontSize:   '10px',
              fontWeight: 600,
              lineHeight: 1.2,
              textAlign:  'center',
            }}>
              {cat.label}
            </span>
          </button>
        ))}
      </div>

      {/* Filters */}
      <div style={{
        display:     'flex',
        gap:         '12px',
        marginBottom:'24px',
        flexWrap:    'wrap',
        alignItems:  'center',
      }}>
        <input
          type="text"
          placeholder="Search listings..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            flex:         1,
            minWidth:     '200px',
            padding:      '10px 16px',
            background:   'rgba(255,255,255,0.05)',
            border:       '1px solid rgba(255,255,255,0.1)',
            borderRadius: '50px',
            color:        '#fff',
            fontSize:     '14px',
            outline:      'none',
          }}
        />
        <select value={maxPrice}  onChange={e => setMaxPrice(e.target.value)}  style={selectStyle}>
          <option value="">Any price</option>
          <option value="10">Under €10</option>
          <option value="25">Under €25</option>
          <option value="50">Under €50</option>
          <option value="100">Under €100</option>
          <option value="200">Under €200</option>
        </select>
        <select value={condition} onChange={e => setCondition(e.target.value)} style={selectStyle}>
          <option value="">Any condition</option>
          {CONDITIONS.map(c => (
            <option key={c.id} value={c.id}>{c.label}</option>
          ))}
        </select>
        <select value={sortBy}    onChange={e => setSortBy(e.target.value)}    style={selectStyle}>
          <option value="newest">Newest first</option>
          <option value="price_asc">Price: Low to high</option>
          <option value="price_desc">Price: High to low</option>
        </select>
      </div>

      {/* Listings grid */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <p style={{ color: '#888', fontSize: '16px', margin: '0 0 8px' }}>No listings found</p>
          <p style={{ color: '#555', fontSize: '13px', margin: 0 }}>Try adjusting your filters</p>
        </div>
      ) : (
        <div style={{
          display:             'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
          gap:                 '16px',
        }}>
          {filtered.map(listing => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      )}
    </div>
  )
}
