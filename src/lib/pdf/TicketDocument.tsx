import React from 'react'
import {
  Document,
  Page,
  View,
  Text,
  Image,
  StyleSheet,
} from '@react-pdf/renderer'

export type PdfTicket = {
  guestName:  string
  title:      string
  date:       string
  tier?:      string | null
  bookingRef: string
  qrCode:     string | null
  type:       'EVENT' | 'TRIP'
}

const CORAL  = '#E91E8C'
const NAVY   = '#0D0D0D'
const GREY   = '#666680'
const BORDER = '#E8E8F0'

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    backgroundColor: '#F5F5FA',
    padding: 24,
  },
  heading: {
    fontSize: 9,
    color: GREY,
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  card: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    border: `1 solid ${BORDER}`,
    overflow: 'hidden',
    marginBottom: 0,
  },
  cardHeader: {
    backgroundColor: NAVY,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  typeBadge: {
    backgroundColor: CORAL,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  typeBadgeText: {
    fontSize: 7,
    fontFamily: 'Helvetica-Bold',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  headerRef: {
    fontSize: 7,
    color: 'rgba(255,255,255,0.4)',
    fontFamily: 'Courier',
  },
  cardBody: {
    padding: 12,
    flexDirection: 'row',
    gap: 10,
  },
  infoCol: {
    flex: 1,
  },
  guestName: {
    fontSize: 13,
    fontFamily: 'Helvetica-Bold',
    color: NAVY,
    marginBottom: 4,
  },
  eventTitle: {
    fontSize: 9,
    color: '#333355',
    marginBottom: 2,
  },
  eventDate: {
    fontSize: 8,
    color: GREY,
    marginBottom: 8,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  metaLabel: {
    fontSize: 7,
    color: GREY,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  metaValue: {
    fontSize: 8,
    color: NAVY,
    fontFamily: 'Helvetica-Bold',
  },
  tierBadge: {
    backgroundColor: '#FFF3E8',
    borderRadius: 3,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  tierText: {
    fontSize: 7,
    color: CORAL,
    fontFamily: 'Helvetica-Bold',
  },
  refBox: {
    backgroundColor: '#F5F5FA',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 4,
    marginTop: 6,
  },
  refLabel: {
    fontSize: 6,
    color: GREY,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  refValue: {
    fontSize: 8,
    fontFamily: 'Courier-Bold',
    color: NAVY,
    letterSpacing: 1,
  },
  qrCol: {
    width: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrImage: {
    width: 76,
    height: 76,
  },
  qrPlaceholder: {
    width: 76,
    height: 76,
    backgroundColor: '#F5F5FA',
    border: `1 dashed ${BORDER}`,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrPlaceholderText: {
    fontSize: 7,
    color: GREY,
    textAlign: 'center',
  },
  cardFooter: {
    borderTop: `1 solid ${BORDER}`,
    paddingHorizontal: 12,
    paddingVertical: 5,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  footerText: {
    fontSize: 7,
    color: GREY,
  },
})

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString('en-GB', {
      weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
    })
  } catch {
    return iso
  }
}

function tierLabel(tier: string) {
  if (tier === 'early_bird') return '🔥 Early Bird'
  if (tier === 'group')      return '👥 Group'
  return '💰 Standard'
}

function TicketCard({ ticket }: { ticket: PdfTicket }) {
  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.cardHeader}>
        <View style={styles.typeBadge}>
          <Text style={styles.typeBadgeText}>{ticket.type}</Text>
        </View>
        <Text style={styles.headerRef}>{ticket.bookingRef}</Text>
      </View>

      {/* Body */}
      <View style={styles.cardBody}>
        {/* Left: info */}
        <View style={styles.infoCol}>
          <Text style={styles.guestName}>{ticket.guestName}</Text>
          <Text style={styles.eventTitle}>{ticket.title}</Text>
          <Text style={styles.eventDate}>{formatDate(ticket.date)}</Text>

          {ticket.tier && (
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Tier</Text>
              <View style={styles.tierBadge}>
                <Text style={styles.tierText}>{tierLabel(ticket.tier)}</Text>
              </View>
            </View>
          )}

          <View style={styles.refBox}>
            <Text style={styles.refLabel}>Booking Ref</Text>
            <Text style={styles.refValue}>{ticket.bookingRef}</Text>
          </View>
        </View>

        {/* Right: QR */}
        <View style={styles.qrCol}>
          {ticket.qrCode ? (
            // eslint-disable-next-line jsx-a11y/alt-text
            <Image style={styles.qrImage} src={ticket.qrCode} />
          ) : (
            <View style={styles.qrPlaceholder}>
              <Text style={styles.qrPlaceholderText}>No QR{'\n'}Code</Text>
            </View>
          )}
        </View>
      </View>

      {/* Footer */}
      <View style={styles.cardFooter}>
        <Text style={styles.footerText}>Erasmus Life Valencia</Text>
        <Text style={styles.footerText}>@erasmuslifevalencia</Text>
      </View>
    </View>
  )
}

interface Props {
  tickets:   PdfTicket[]
  docTitle?: string
}

export default function TicketDocument({ tickets, docTitle }: Props) {
  return (
    <Document title={docTitle ?? 'Tickets'} author="Erasmus Life Admin">
      <Page size="A4" style={styles.page}>
        {docTitle && <Text style={styles.heading}>{docTitle}</Text>}
        <View style={styles.grid}>
          {tickets.map((t, i) => (
            <TicketCard key={i} ticket={t} />
          ))}
        </View>
      </Page>
    </Document>
  )
}
