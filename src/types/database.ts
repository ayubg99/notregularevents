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
export type MembershipPlan   = 'basic' | 'premium' | 'vip' | 'employer'
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
  is_free:               boolean
  members_only_free:     boolean
  status:                EventStatus
  created_by:            string | null
  created_at:            string
  updated_at:            string
  gallery_images:        string[] | null
  ticket_tiers:          EventTicketTier[] | null
}

export type EventTicketRow = {
  id:                string
  event_id:          string
  user_id:           string | null
  booking_ref:       string
  qr_code:           string | null
  status:            TicketStatus
  stripe_payment_id: string | null
  amount_paid:       number | null
  guest_name:        string | null
  guest_email:       string | null
  guest_phone:       string | null
  checked_in:        boolean | null
  checked_in_at:     string  | null
  created_at:        string
  updated_at:        string
  group_booking_ref: string  | null
  is_group_booking:  boolean | null
  lead_name:         string  | null
  lead_email:        string  | null
  ambassador_id:     string  | null
  referral_code:     string  | null
  ticket_tier_name:  string  | null
  promo_code_used:   string  | null
}

export type ItineraryDay    = { day: number; title: string; description: string }
export type EventTicketTier = { name: string; price: number; description: string }
export type TripExtra       = { id: string; name: string; price: number; description: string }

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
  gallery_images:     string[] | null
  extras:             TripExtra[] | null
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
  amount_paid:       number | null
  quantity:          number
  guest_name:        string | null
  guest_email:       string | null
  guest_phone:       string | null
  checked_in:        boolean | null
  checked_in_at:     string  | null
  created_at:        string
  updated_at:        string
  ambassador_id:     string | null
  referral_code:     string | null
  selected_extras:   TripExtra[] | null
  promo_code_used:   string | null
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

export type PromoAppliesTo = 'events' | 'trips' | 'both'

export type PromoCodeRow = {
  id:             string
  code:           string
  discount_type:  DiscountType
  discount_value: number
  applies_to:     PromoAppliesTo
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
  id:               string
  user_id:          string
  referral_code:    string
  total_referrals:  number
  total_earnings:   number
  pending_earnings: number
  paid_earnings:    number
  commission_rate:  number
  status:           AmbassadorStatus
  created_at:       string
  updated_at:       string
}

export type AmbassadorCommissionRow = {
  id:                string
  ambassador_id:     string
  booking_type:      'event' | 'trip'
  booking_ref:       string | null
  event_title:       string | null
  amount_paid:       number
  commission_rate:   number
  commission_earned: number
  status:            'pending' | 'paid' | 'cancelled'
  paid_at:           string | null
  created_at:        string
}

export type AmbassadorRewardRow = {
  id:            string
  ambassador_id: string
  reward_type:   'free_ticket' | 'membership_upgrade' | 'cash_bonus' | 'discount_code'
  description:   string | null
  value:         number | null
  status:        'pending' | 'claimed' | 'expired'
  expires_at:    string | null
  created_at:    string
}

export type AmbassadorApplicationRow = {
  id:         string
  name:       string
  email:      string
  university: string | null
  instagram:  string | null
  why_join:   string | null
  status:     'pending' | 'approved' | 'rejected'
  created_at: string
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

export type EventInsert = Omit<EventRow, 'id' | 'tickets_sold' | 'created_at' | 'updated_at' | 'price_early_bird' | 'price_group' | 'early_bird_deadline' | 'early_bird_seats' | 'early_bird_seats_sold' | 'group_min_size' | 'is_free' | 'members_only_free' | 'gallery_images' | 'ticket_tiers'> & {
  tickets_sold?:         number
  status?:               EventStatus
  price_early_bird?:     number | null
  price_group?:          number | null
  early_bird_deadline?:  string | null
  early_bird_seats?:     number
  early_bird_seats_sold?: number
  group_min_size?:       number | null
  is_free?:              boolean
  members_only_free?:    boolean
  gallery_images?:       string[] | null
  ticket_tiers?:         EventTicketTier[] | null
}

export type EventTicketInsert = Omit<EventTicketRow, 'id' | 'created_at' | 'updated_at' | 'amount_paid' | 'checked_in' | 'checked_in_at' | 'group_booking_ref' | 'is_group_booking' | 'lead_name' | 'lead_email' | 'ambassador_id' | 'referral_code'> & {
  status?:            TicketStatus
  amount_paid?:       number | null
  checked_in?:        boolean | null
  checked_in_at?:     string  | null
  group_booking_ref?: string  | null
  is_group_booking?:  boolean | null
  lead_name?:         string  | null
  lead_email?:        string  | null
  ambassador_id?:     string  | null
  referral_code?:     string  | null
}

export type TripInsert = Omit<TripRow, 'id' | 'seats_sold' | 'created_at' | 'updated_at' | 'price_vip' | 'early_bird_deadline' | 'early_bird_seats' | 'early_bird_seats_sold' | 'group_min_size' | 'gallery_images' | 'extras'> & {
  seats_sold?:            number
  status?:                TripStatus
  price_vip?:             number | null
  early_bird_deadline?:   string | null
  early_bird_seats?:      number
  early_bird_seats_sold?: number
  group_min_size?:        number | null
  gallery_images?:        string[] | null
  extras?:                TripExtra[] | null
}

export type TripBookingInsert = Omit<TripBookingRow, 'id' | 'created_at' | 'updated_at' | 'amount_paid' | 'quantity' | 'checked_in' | 'checked_in_at' | 'ambassador_id' | 'referral_code' | 'selected_extras'> & {
  status?:          BookingStatus
  deposit_paid?:    boolean
  amount_paid?:     number | null
  quantity?:        number
  checked_in?:      boolean | null
  checked_in_at?:   string  | null
  ambassador_id?:   string  | null
  referral_code?:   string  | null
  selected_extras?: TripExtra[] | null
}

export type MembershipInsert = Omit<MembershipRow, 'id' | 'created_at' | 'updated_at' | 'stripe_customer_id'> & {
  status?:             MembershipStatus
  stripe_customer_id?: string | null
}

export type PromoCodeInsert = Omit<PromoCodeRow, 'id' | 'created_at' | 'updated_at'>

export type ReviewInsert = Omit<ReviewRow, 'id' | 'created_at' | 'updated_at'>

export type AmbassadorInsert = Omit<AmbassadorRow, 'id' | 'total_referrals' | 'total_earnings' | 'pending_earnings' | 'paid_earnings' | 'created_at' | 'updated_at'> & {
  total_referrals?:  number
  total_earnings?:   number
  pending_earnings?: number
  paid_earnings?:    number
  commission_rate?:  number
  status?:           AmbassadorStatus
}

export type AmbassadorCommissionInsert = Omit<AmbassadorCommissionRow, 'id' | 'created_at' | 'paid_at'> & {
  paid_at?: string | null
}

export type AmbassadorRewardInsert = Omit<AmbassadorRewardRow, 'id' | 'created_at'>

export type AmbassadorApplicationInsert = Omit<AmbassadorApplicationRow, 'id' | 'created_at'> & {
  status?: AmbassadorApplicationRow['status']
}

export type NotificationInsert = Omit<NotificationRow, 'id' | 'created_at' | 'updated_at'> & {
  read?: boolean
}

// ─── Housing ──────────────────────────────────────────────────

export type HousingType       = 'room_available' | 'looking_for_room'
export type HousingRoomType   = 'private_room' | 'shared_room' | 'studio' | 'full_apartment'
export type HousingGenderPref = 'male' | 'female' | 'mixed' | 'any'
export type HousingStatus     = 'active' | 'inactive' | 'rented'

export type HousingListingRow = {
  id:                      string
  type:                    HousingType
  title:                   string
  description:             string | null
  price:                   number | null
  neighborhood:            string | null
  room_type:               HousingRoomType | null
  available_from:          string | null
  available_until:         string | null
  flatmates_count:         number
  flatmates_nationalities: string[]
  amenities:               string[]
  contact_name:            string
  contact_whatsapp:        string | null
  contact_email:           string | null
  nationality:             string | null
  university:              string | null
  gender_preference:       HousingGenderPref
  photos:                  string[]
  status:                  HousingStatus
  views:                   number
  expires_at:              string
  created_at:              string
  updated_at:              string
  user_id:                 string | null
}

export type HousingListingInsert = Omit<HousingListingRow, 'id' | 'created_at' | 'updated_at' | 'views'>
export type HousingListingUpdate = Partial<Omit<HousingListingRow, 'id' | 'created_at' | 'updated_at'>>

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
export type AmbassadorUpdate           = Partial<Omit<AmbassadorRow, 'id' | 'user_id' | 'created_at' | 'updated_at'>>
export type AmbassadorCommissionUpdate = Partial<Omit<AmbassadorCommissionRow, 'id' | 'ambassador_id' | 'created_at'>>
export type AmbassadorRewardUpdate     = Partial<Omit<AmbassadorRewardRow, 'id' | 'ambassador_id' | 'created_at'>>
export type AmbassadorApplicationUpdate = Partial<Omit<AmbassadorApplicationRow, 'id' | 'created_at'>>
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
      ambassador_commissions: {
        Row:           AmbassadorCommissionRow
        Insert:        AmbassadorCommissionInsert
        Update:        AmbassadorCommissionUpdate
        Relationships: never[]
      }
      ambassador_rewards: {
        Row:           AmbassadorRewardRow
        Insert:        AmbassadorRewardInsert
        Update:        AmbassadorRewardUpdate
        Relationships: never[]
      }
      ambassador_applications: {
        Row:           AmbassadorApplicationRow
        Insert:        AmbassadorApplicationInsert
        Update:        AmbassadorApplicationUpdate
        Relationships: never[]
      }
      notifications: {
        Row:           NotificationRow
        Insert:        NotificationInsert
        Update:        NotificationUpdate
        Relationships: never[]
      }
      housing_listings: {
        Row:           HousingListingRow
        Insert:        HousingListingInsert
        Update:        HousingListingUpdate
        Relationships: never[]
      }
      housing_partners: {
        Row:           HousingPartnerRow
        Insert:        HousingPartnerInsert
        Update:        HousingPartnerUpdate
        Relationships: never[]
      }
      partner_rooms: {
        Row:           PartnerRoomRow
        Insert:        PartnerRoomInsert
        Update:        PartnerRoomUpdate
        Relationships: never[]
      }
      room_contacts: {
        Row:           RoomContactDbRow
        Insert:        RoomContactInsert
        Update:        Partial<RoomContactInsert>
        Relationships: never[]
      }
      sponsors: {
        Row:           SponsorRow
        Insert:        SponsorInsert
        Update:        SponsorUpdate
        Relationships: never[]
      }
      job_listings: {
        Row:           JobListingRow
        Insert:        JobListingInsert
        Update:        JobListingUpdate
        Relationships: never[]
      }
      employer_accounts: {
        Row:           EmployerAccountRow
        Insert:        EmployerAccountInsert
        Update:        EmployerAccountUpdate
        Relationships: never[]
      }
      marketplace_listings: {
        Row:           MarketplaceListingRow
        Insert:        MarketplaceListingInsert
        Update:        MarketplaceListingUpdate
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
      increment_contacts_sold: {
        Args:    { p_room_id: string }
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

// ─── Partner Rooms ────────────────────────────────────────────

export type HousingPartnerStatus = 'active' | 'inactive'
export type PartnerRoomStatus    = 'available' | 'reserved' | 'occupied'
export type PartnerRoomType      = 'private_room' | 'shared_room' | 'studio' | 'full_apartment'
export type GenderPreference     = 'male' | 'female' | 'mixed' | 'any'
export type RoomContactStatus    = 'pending' | 'confirmed' | 'contact_shared' | 'rejected' | 'refunded' | 'cancelled'

export type HousingPartnerRow = {
  id:            string
  name:          string
  contact_name:  string
  contact_email: string
  contact_phone: string | null
  whatsapp:      string | null
  description:   string | null
  logo_url:      string | null
  status:        HousingPartnerStatus
  created_at:    string
  updated_at:    string
}

export type PartnerRoomRow = {
  id:                      string
  partner_id:              string
  title:                   string
  slug:                    string | null
  description:             string | null
  neighborhood:            string
  address:                 string | null
  room_type:               PartnerRoomType
  monthly_rent:            number
  deposit_amount:          number
  platform_fee:            number
  available_from:          string | null
  available_until:         string | null
  flatmates_count:         number
  flatmates_nationalities: string[]
  amenities:               string[]
  bills_included:          boolean
  gender_preference:       GenderPreference
  photos:                  string[]
  status:                  PartnerRoomStatus
  featured:                boolean
  views:                   number
  contacts_sold:           number
  created_at:              string
  updated_at:              string
  housing_partners?:       Pick<HousingPartnerRow, 'name' | 'logo_url' | 'contact_email' | 'contact_phone' | 'whatsapp' | 'contact_name'> | null
}

export type RoomContactRow = {
  id:                string
  room_id:           string | null
  partner_id:        string | null
  booking_ref:       string
  guest_name:        string
  guest_email:       string
  guest_phone:       string | null
  guest_nationality: string | null
  university:        string | null
  move_in_date:      string | null
  duration_months:   number
  message:           string | null
  platform_fee:      number
  stripe_payment_id: string | null
  status:            RoomContactStatus
  created_at:        string
  partner_rooms?:    Pick<PartnerRoomRow, 'title' | 'neighborhood' | 'monthly_rent'> | null
  housing_partners?: Pick<HousingPartnerRow, 'name'> | null
}

export type HousingPartnerInsert = Omit<HousingPartnerRow, 'id' | 'created_at' | 'updated_at'> & {
  status?: HousingPartnerStatus
}
export type HousingPartnerUpdate = Partial<Omit<HousingPartnerRow, 'id' | 'created_at' | 'updated_at'>>

export type PartnerRoomInsert = Omit<PartnerRoomRow, 'id' | 'created_at' | 'updated_at' | 'views' | 'contacts_sold' | 'housing_partners'> & {
  status?:        PartnerRoomStatus
  featured?:      boolean
  views?:         number
  contacts_sold?: number
}
export type PartnerRoomUpdate = Partial<Omit<PartnerRoomRow, 'id' | 'partner_id' | 'created_at' | 'updated_at' | 'housing_partners'>>

export type RoomContactDbRow = {
  id:                    string
  room_id:               string | null
  partner_id:            string | null
  booking_ref:           string
  guest_name:            string
  guest_email:           string
  guest_phone:           string | null
  guest_nationality:     string | null
  university:            string | null
  move_in_date:          string | null
  duration_months:       number
  message:               string | null
  platform_fee:          number
  stripe_payment_id:     string | null
  status:                RoomContactStatus
  confirmation_deadline: string | null
  confirmed_at:          string | null
  rejected_at:           string | null
  rejection_reason:      string | null
  refund_id:             string | null
  created_at:            string
}

export type RoomContactInsert = Omit<
  RoomContactDbRow,
  'id' | 'created_at' | 'status' | 'confirmation_deadline' | 'confirmed_at' | 'rejected_at' | 'rejection_reason' | 'refund_id'
> & {
  status?:                RoomContactStatus
  confirmation_deadline?: string | null
  confirmed_at?:          string | null
  rejected_at?:           string | null
  rejection_reason?:      string | null
  refund_id?:             string | null
}

// ─── Sponsors ─────────────────────────────────────────────────

export type SponsorCategory = 'general' | 'food_drink' | 'fitness' | 'nightlife' | 'travel' | 'fashion' | 'tech' | 'other'
export type SponsorStatus   = 'active' | 'inactive'

export type SponsorRow = {
  id:                      string
  name:                    string
  logo_url:                string | null
  website_url:             string | null
  description:             string | null
  discount_text:           string | null
  discount_code:           string | null
  redemption_instructions: string | null
  members_only:            boolean
  category:                SponsorCategory
  is_featured:             boolean
  status:                  SponsorStatus
  display_order:           number
  created_at:              string
}

export type SponsorInsert = Omit<SponsorRow, 'id' | 'created_at'> & {
  category?:      SponsorCategory
  is_featured?:   boolean
  status?:        SponsorStatus
  display_order?: number
  members_only?:  boolean
}

export type SponsorUpdate = Partial<Omit<SponsorRow, 'id' | 'created_at'>>

// ─── Non-schema insert types (tables added via migration) ─────

export type ContactMessageInsert = {
  name:    string
  email:   string
  subject: string
  message: string
}

// ─── Jobs ─────────────────────────────────────────────────────

export type JobType     = 'part_time' | 'internship' | 'full_time' | 'freelance' | 'volunteer'
export type JobCategory = 'hospitality' | 'marketing' | 'tech' | 'education' | 'retail' | 'events' | 'language' | 'other'
export type JobStatus   = 'active' | 'closed' | 'draft'
export type JobLanguage = 'english' | 'spanish' | 'both' | 'any'

export type JobListingRow = {
  id:                string
  title:             string
  company_name:      string
  company_logo_url:  string | null
  description:       string
  requirements:      string | null
  location:          string
  job_type:          JobType
  category:          JobCategory
  salary_text:       string | null
  hours_per_week:    number | null
  language_required: JobLanguage
  apply_email:       string | null
  apply_whatsapp:    string | null
  apply_url:         string | null
  contact_name:      string | null
  is_featured:       boolean
  is_urgent:         boolean
  status:            JobStatus
  posted_by_user_id: string | null
  expires_at:        string
  views:             number
  applications:      number
  management_token:    string | null
  poster_email:        string | null
  employer_account_id: string | null
  created_at:          string
  updated_at:        string
}

export type JobListingInsert = Omit<JobListingRow, 'id' | 'created_at' | 'updated_at' | 'views' | 'applications' | 'management_token' | 'poster_email' | 'employer_account_id'> & {
  status?:             JobStatus
  is_featured?:        boolean
  is_urgent?:          boolean
  views?:              number
  applications?:       number
  management_token?:   string | null
  poster_email?:       string | null
  employer_account_id?: string | null
}

export type JobListingUpdate = Partial<Omit<JobListingRow, 'id' | 'created_at' | 'updated_at'>>

// ─── Employer Accounts ────────────────────────────────────────

export type EmployerPlan   = 'free' | 'featured' | 'subscription'
export type EmployerStatus = 'active' | 'suspended' | 'cancelled'

export type EmployerAccountRow = {
  id:                     string
  user_id:                string | null
  company_name:           string
  company_logo_url:       string | null
  contact_name:           string
  email:                  string
  phone:                  string | null
  website:                string | null
  description:            string | null
  stripe_customer_id:     string | null
  stripe_subscription_id: string | null
  plan:                   EmployerPlan
  plan_expires_at:        string | null
  status:                 EmployerStatus
  created_at:             string
  updated_at:             string
}

export type EmployerAccountInsert = {
  user_id:                  string | null
  company_name:             string
  contact_name:             string
  email:                    string
  company_logo_url?:        string | null
  phone?:                   string | null
  website?:                 string | null
  description?:             string | null
  stripe_customer_id?:      string | null
  stripe_subscription_id?:  string | null
  plan?:                    EmployerPlan
  plan_expires_at?:         string | null
  status?:                  EmployerStatus
}

export type EmployerAccountUpdate = Partial<Omit<EmployerAccountRow, 'id' | 'created_at' | 'updated_at'>>

// ─── Marketplace ──────────────────────────────────────────────

export type MarketplaceCategory = 'clothes_women' | 'clothes_men' | 'shoes_women' | 'shoes_men' | 'bags_accessories' | 'electronics' | 'furniture' | 'books_studies' | 'kitchen_home' | 'sports_outdoors' | 'beauty_health' | 'bikes_transport' | 'tickets_events' | 'games_hobbies' | 'other'
export type MarketplaceCondition = 'new_with_tags' | 'new_without_tags' | 'very_good' | 'good' | 'satisfactory'
export type MarketplaceStatus = 'active' | 'sold' | 'reserved' | 'inactive'

export type MarketplaceListingRow = {
  id:                 string
  user_id:            string | null
  title:              string
  description:        string | null
  price:              number
  category:           MarketplaceCategory
  size_clothes:       string | null
  size_shoes:         string | null
  condition:          MarketplaceCondition
  event_date:         string | null
  event_venue:        string | null
  ticket_quantity:    number | null
  brand:              string | null
  color:              string | null
  photos:             string[]
  location:           string | null
  neighborhood:       string | null
  contact_whatsapp:   string | null
  contact_email:      string | null
  seller_name:        string
  seller_nationality: string | null
  university:         string | null
  is_free:            boolean
  is_negotiable:      boolean
  status:             MarketplaceStatus
  views:              number
  expires_at:         string
  created_at:         string
  updated_at:         string
}

export type MarketplaceListingInsert = Omit<MarketplaceListingRow, 'id' | 'views' | 'created_at' | 'updated_at'> & {
  views?:      number
  expires_at?: string
}
export type MarketplaceListingUpdate = Partial<Omit<MarketplaceListingRow, 'id' | 'created_at' | 'updated_at'>>
