// Auto-generated TypeScript types mirroring src/lib/supabase/schema.sql
// Follows Supabase generated-types convention: Database["public"]["Tables"][T]["Row"]

export type UserRole         = 'student' | 'admin' | 'ambassador'
export type EventStatus      = 'draft' | 'published' | 'cancelled' | 'completed'
export type EventCategory    = 'party' | 'cultural' | 'sport' | 'networking' | 'trip' | 'other'
  | 'language_exchange' | 'food_wine' | 'hiking' | 'yoga' | 'art' | 'international_dinner'
export type TicketStatus     = 'active' | 'used' | 'cancelled' | 'refunded'
export type TripStatus       = 'draft' | 'published' | 'cancelled' | 'completed'
export type TripTier         = 'early_bird' | 'standard' | 'group'
export type BookingStatus    = 'pending' | 'confirmed' | 'cancelled' | 'refunded'
export type MembershipPlan   = 'basic' | 'premium' | 'vip'
export type MembershipStatus = 'active' | 'cancelled' | 'expired' | 'trialing'
export type DiscountType     = 'percentage' | 'fixed'
export type ReviewTarget     = 'event' | 'trip'
export type AmbassadorStatus = 'active' | 'inactive' | 'suspended'
export type NotificationType =
  | 'booking_confirmed'
  | 'booking_cancelled'
  | 'event_reminder'
  | 'trip_reminder'
  | 'payment_failed'
  | 'membership_expiring'
  | 'new_message'
  | 'promo'
  | 'system'

// ─── Row types (what you get back from SELECT) ────────────────
// NOTE: Must be `type` (not `interface`) so they satisfy Record<string, unknown>
// for the Supabase GenericTable constraint in strict TypeScript.

export type UserRow = {
  id:         string
  email:      string
  full_name:  string | null
  avatar_url: string | null
  role:       UserRole
  created_at: string
  updated_at: string
}

export type ProfileRow = {
  id:                string
  user_id:           string
  bio:               string | null
  nationality:       string | null
  university:        string | null
  instagram:         string | null
  whatsapp:          string | null
  membership_status: MembershipStatus | null
  created_at:        string
  updated_at:        string
}

export type EventRow = {
  id:                    string
  title:                 string
  slug:                  string
  description:           string | null
  category:              EventCategory
  date:                  string
  location:              string | null
  image_url:             string | null
  price:                 number
  price_early_bird:      number | null
  price_group:           number | null
  early_bird_deadline:   string | null
  early_bird_seats:      number
  early_bird_seats_sold: number
  capacity:              number
  tickets_sold:          number
  group_min_size:        number | null
  status:                EventStatus
  created_by:            string | null
  created_at:            string
  updated_at:            string
}

export type EventTicketRow = {
  id:                string
  event_id:          string
  user_id:           string | null
  booking_ref:       string
  qr_code:           string | null
  status:            TicketStatus
  stripe_payment_id: string | null
  guest_name:        string | null
  guest_email:       string | null
  guest_phone:       string | null
  created_at:        string
  updated_at:        string
}

export type ItineraryDay = { day: number; title: string; description: string }

export type TripRow = {
  id:                 string
  title:              string
  slug:               string
  description:        string | null
  category:           string | null
  destination:        string
  start_date:         string
  end_date:           string
  price_early_bird:      number | null
  price_standard:        number
  price_vip:             number | null
  price_group:           number | null
  early_bird_deadline:   string | null
  early_bird_seats:      number
  early_bird_seats_sold: number
  capacity:              number
  seats_sold:            number
  group_min_size:        number | null
  image_url:          string | null
  status:             TripStatus
  created_by:         string | null
  created_at:         string
  updated_at:         string
  // ── Detail fields (added via migration) ──
  itinerary:          ItineraryDay[] | null
  whats_included:     string[] | null
  whats_excluded:     string[] | null
  meeting_points:     string[] | null
  whatsapp_group_url: string | null
}

export type TripBookingRow = {
  id:                string
  trip_id:           string
  user_id:           string | null
  tier:              TripTier
  booking_ref:       string
  qr_code:           string | null
  status:            BookingStatus
  stripe_payment_id: string | null
  deposit_paid:      boolean
  guest_name:        string | null
  guest_email:       string | null
  guest_phone:       string | null
  created_at:        string
  updated_at:        string
}

export type MembershipRow = {
  id:                     string
  user_id:                string
  plan:                   MembershipPlan
  status:                 MembershipStatus
  stripe_subscription_id: string | null
  stripe_customer_id:     string | null
  start_date:             string
  end_date:               string | null
  created_at:             string
  updated_at:             string
}

export type PromoCodeRow = {
  id:             string
  code:           string
  discount_type:  DiscountType
  discount_value: number
  uses_remaining: number | null
  expires_at:     string | null
  created_at:     string
  updated_at:     string
}

export type ReviewRow = {
  id:          string
  user_id:     string
  target_type: ReviewTarget
  target_id:   string
  rating:      number
  comment:     string | null
  created_at:  string
  updated_at:  string
}

export type AmbassadorRow = {
  id:              string
  user_id:         string
  referral_code:   string
  total_referrals: number
  total_earnings:  number
  status:          AmbassadorStatus
  created_at:      string
  updated_at:      string
}

export type NotificationRow = {
  id:         string
  user_id:    string
  type:       NotificationType
  message:    string
  read:       boolean
  created_at: string
  updated_at: string
}

// ─── Insert types (what you pass to INSERT) ───────────────────

export type UserInsert = Omit<UserRow, 'created_at' | 'updated_at'> & {
  role?: UserRole
}

export type ProfileInsert = Omit<ProfileRow, 'id' | 'created_at' | 'updated_at'>

export type EventInsert = Omit<EventRow, 'id' | 'tickets_sold' | 'created_at' | 'updated_at' | 'price_early_bird' | 'price_group' | 'early_bird_deadline' | 'early_bird_seats' | 'early_bird_seats_sold' | 'group_min_size'> & {
  tickets_sold?:         number
  status?:               EventStatus
  price_early_bird?:     number | null
  price_group?:          number | null
  early_bird_deadline?:  string | null
  early_bird_seats?:     number
  early_bird_seats_sold?: number
  group_min_size?:       number | null
}

export type EventTicketInsert = Omit<EventTicketRow, 'id' | 'created_at' | 'updated_at'> & {
  status?: TicketStatus
}

export type TripInsert = Omit<TripRow, 'id' | 'seats_sold' | 'created_at' | 'updated_at' | 'price_vip' | 'early_bird_deadline' | 'early_bird_seats' | 'early_bird_seats_sold' | 'group_min_size'> & {
  seats_sold?:            number
  status?:                TripStatus
  price_vip?:             number | null
  early_bird_deadline?:   string | null
  early_bird_seats?:      number
  early_bird_seats_sold?: number
  group_min_size?:        number | null
}

export type TripBookingInsert = Omit<TripBookingRow, 'id' | 'created_at' | 'updated_at'> & {
  status?: BookingStatus
  deposit_paid?: boolean
}

export type MembershipInsert = Omit<MembershipRow, 'id' | 'created_at' | 'updated_at' | 'stripe_customer_id'> & {
  status?:             MembershipStatus
  stripe_customer_id?: string | null
}

export type PromoCodeInsert = Omit<PromoCodeRow, 'id' | 'created_at' | 'updated_at'>

export type ReviewInsert = Omit<ReviewRow, 'id' | 'created_at' | 'updated_at'>

export type AmbassadorInsert = Omit<AmbassadorRow, 'id' | 'total_referrals' | 'total_earnings' | 'created_at' | 'updated_at'> & {
  total_referrals?: number
  total_earnings?: number
  status?: AmbassadorStatus
}

export type NotificationInsert = Omit<NotificationRow, 'id' | 'created_at' | 'updated_at'> & {
  read?: boolean
}

// ─── Update types (partial inserts, no id/timestamps) ─────────

export type UserUpdate        = Partial<UserInsert>
export type ProfileUpdate     = Partial<Omit<ProfileRow, 'id' | 'user_id' | 'created_at' | 'updated_at'>>
export type EventUpdate       = Partial<Omit<EventRow, 'id' | 'created_at' | 'updated_at'>>
export type EventTicketUpdate = Partial<Omit<EventTicketRow, 'id' | 'event_id' | 'user_id' | 'created_at' | 'updated_at'>>
export type TripUpdate        = Partial<Omit<TripRow, 'id' | 'created_at' | 'updated_at'>>
export type TripBookingUpdate = Partial<Omit<TripBookingRow, 'id' | 'trip_id' | 'user_id' | 'created_at' | 'updated_at'>>
export type MembershipUpdate  = Partial<Omit<MembershipRow, 'id' | 'user_id' | 'created_at' | 'updated_at'>>
export type PromoCodeUpdate   = Partial<Omit<PromoCodeRow, 'id' | 'created_at' | 'updated_at'>>
export type ReviewUpdate      = Partial<Omit<ReviewRow, 'id' | 'user_id' | 'target_type' | 'target_id' | 'created_at' | 'updated_at'>>
export type AmbassadorUpdate  = Partial<Omit<AmbassadorRow, 'id' | 'user_id' | 'created_at' | 'updated_at'>>
export type NotificationUpdate = Partial<Omit<NotificationRow, 'id' | 'user_id' | 'created_at' | 'updated_at'>>

// ─── Supabase Database type (used to type the client) ─────────

export interface Database {
  public: {
    Tables: {
      users: {
        Row:           UserRow
        Insert:        UserInsert
        Update:        UserUpdate
        Relationships: never[]
      }
      profiles: {
        Row:           ProfileRow
        Insert:        ProfileInsert
        Update:        ProfileUpdate
        Relationships: never[]
      }
      events: {
        Row:           EventRow
        Insert:        EventInsert
        Update:        EventUpdate
        Relationships: never[]
      }
      event_tickets: {
        Row:           EventTicketRow
        Insert:        EventTicketInsert
        Update:        EventTicketUpdate
        Relationships: never[]
      }
      trips: {
        Row:           TripRow
        Insert:        TripInsert
        Update:        TripUpdate
        Relationships: never[]
      }
      trip_bookings: {
        Row:           TripBookingRow
        Insert:        TripBookingInsert
        Update:        TripBookingUpdate
        Relationships: never[]
      }
      memberships: {
        Row:           MembershipRow
        Insert:        MembershipInsert
        Update:        MembershipUpdate
        Relationships: never[]
      }
      promo_codes: {
        Row:           PromoCodeRow
        Insert:        PromoCodeInsert
        Update:        PromoCodeUpdate
        Relationships: never[]
      }
      reviews: {
        Row:           ReviewRow
        Insert:        ReviewInsert
        Update:        ReviewUpdate
        Relationships: never[]
      }
      ambassadors: {
        Row:           AmbassadorRow
        Insert:        AmbassadorInsert
        Update:        AmbassadorUpdate
        Relationships: never[]
      }
      notifications: {
        Row:           NotificationRow
        Insert:        NotificationInsert
        Update:        NotificationUpdate
        Relationships: never[]
      }
    }
    Views:          { [_ in never]: never }
    Functions: {
      create_event_ticket: {
        Args: {
          p_event_id:          string
          p_booking_ref:       string
          p_qr_code:           string
          p_stripe_payment_id: string
          p_quantity?:         number
          p_user_id?:          string | null
          p_guest_name?:       string | null
          p_guest_email?:      string | null
          p_guest_phone?:      string | null
        }
        Returns: string
      }
      create_trip_booking: {
        Args: {
          p_trip_id:           string
          p_tier:              TripTier
          p_booking_ref:       string
          p_qr_code:           string
          p_stripe_payment_id: string
          p_user_id?:          string | null
          p_guest_name?:       string | null
          p_guest_email?:      string | null
          p_guest_phone?:      string | null
        }
        Returns: string
      }
      decrement_promo_uses: {
        Args:    { p_id: string }
        Returns: undefined
      }
    }
    CompositeTypes: { [_ in never]: never }
    Enums: {
      user_role:         UserRole
      event_status:      EventStatus
      event_category:    EventCategory
      ticket_status:     TicketStatus
      trip_status:       TripStatus
      trip_tier:         TripTier
      booking_status:    BookingStatus
      membership_plan:   MembershipPlan
      membership_status: MembershipStatus
      discount_type:     DiscountType
      review_target:     ReviewTarget
      ambassador_status: AmbassadorStatus
      notification_type: NotificationType
    }
  }
}

// ─── Non-schema insert types (tables added via migration) ─────

export type ContactMessageInsert = {
  name:    string
  email:   string
  subject: string
  message: string
}

export type AmbassadorApplicationInsert = {
  name:       string
  email:      string
  university: string
  instagram?: string
  why_join:   string
}
