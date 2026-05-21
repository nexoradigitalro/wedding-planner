export type PlanTier = 'free' | 'basic' | 'pro'
export type MemberRole = 'owner' | 'editor' | 'viewer'
export type GuestCategory = 'family' | 'friends' | 'coworkers' | 'kids'
export type RsvpStatus = 'pending' | 'confirmed' | 'declined'
export type ActivityAction =
  | 'guest_added'
  | 'guest_removed'
  | 'guest_moved'
  | 'guest_updated'
  | 'table_added'
  | 'table_removed'
  | 'rsvp_updated'
  | 'collaborator_invited'

export interface BudgetItem {
  id: string
  event_id: string
  category: string
  name: string
  estimated_amount: number
  paid_amount: number
  notes: string | null
  created_at: string
}

export interface Profile {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  plan_tier: PlanTier
  plan_expires_at: string | null
  created_at: string
}

export interface Event {
  id: string
  owner_id: string
  name: string
  date: string | null
  venue: string | null
  guest_count_target: number | null
  created_at: string
  updated_at: string
}

export interface EventMember {
  id: string
  event_id: string
  user_id: string
  role: MemberRole
  created_at: string
  profile?: Profile
}

export interface Guest {
  id: string
  event_id: string
  name: string
  email: string | null
  phone: string | null
  category: GuestCategory
  rsvp_status: RsvpStatus
  has_plus_one: boolean
  plus_one_name: string | null
  plus_one_confirmed: boolean
  plus_one_portion: 'full' | 'half' | 'none'
  dietary: string | null
  notes: string | null
  table_id: string | null
  seat_number: number | null
  attended: boolean | null
  gift_amount: number | null
  created_at: string
  updated_at: string
  table?: Table
}

export interface Table {
  id: string
  event_id: string
  name: string
  capacity: number
  position_x: number
  position_y: number
  shape: 'round' | 'rectangular' | 'head'
  notes: string | null
  created_at: string
  guests?: Guest[]
}

export interface ActivityLog {
  id: string
  event_id: string
  user_id: string
  action: ActivityAction
  payload: Record<string, unknown>
  created_at: string
  profile?: Profile
}

export interface RsvpResponse {
  id: string
  event_id: string
  token: string
  guest_name: string
  companion_name: string | null
  attending: boolean
  plus_one_count: number
  menu_choice: string | null
  allergies: string | null
  message: string | null
  submitted_at: string
}

export interface QrCode {
  id: string
  event_id: string
  guest_id: string | null
  type: 'invitation' | 'checkin'
  token: string
  created_at: string
}

export interface VenueElement {
  id: string
  event_id: string
  type: string
  label: string | null
  position_x: number
  position_y: number
  width: number
  height: number
  created_at: string
}

export interface InviteLink {
  id: string
  event_id: string
  role: MemberRole
  token: string
  created_by: string
  uses: number
  max_uses: number | null
  expires_at: string | null
  created_at: string
}

export type EventWithMembers = Event & { members: EventMember[] }
export type TableWithGuests = Table & { guests: Guest[] }
