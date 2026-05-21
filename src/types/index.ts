export * from './database'

export interface RealtimeGuestMoved {
  guestId: string
  guestName: string
  fromTableId: string | null
  fromTableName: string | null
  toTableId: string | null
  toTableName: string | null
  byUserId: string
  byUserName: string
}

export interface RealtimePresence {
  userId: string
  userName: string
  avatarUrl: string | null
  onlineAt: string
}

export interface PlanLimits {
  maxGuests: number | null
  maxTables: number | null
  maxEvents: number | null
  maxCollaborators: number | null
  pdfExport: boolean
  qrCheckin: boolean
  activityFeed: boolean
  giftCalculator: boolean
}

export const PLAN_LIMITS: Record<string, PlanLimits> = {
  free: {
    maxGuests: 50,
    maxTables: 10,
    maxEvents: 1,
    maxCollaborators: 0,
    pdfExport: false,
    qrCheckin: false,
    activityFeed: false,
    giftCalculator: false,
  },
  basic: {
    maxGuests: 230,
    maxTables: null,
    maxEvents: 1,
    maxCollaborators: 0,
    pdfExport: false,
    qrCheckin: false,
    activityFeed: true,
    giftCalculator: true,
  },
  pro: {
    maxGuests: null,
    maxTables: null,
    maxEvents: null,
    maxCollaborators: null,
    pdfExport: true,
    qrCheckin: true,
    activityFeed: true,
    giftCalculator: true,
  },
}
