# Wedding Planner SaaS — Nexora Digital

## What this is
A focused wedding seating + collaboration SaaS for Romanian couples.
Competing with nuntapemese.ro and smartseat.ro — beating them on UX, price, and realtime collaboration.

## Tech stack
- Next.js 16 (App Router) + TypeScript
- Tailwind CSS v4 + shadcn/ui (uses @base-ui/react — NOT Radix UI)
- Supabase (auth, postgres, realtime)
- Stripe Checkout (one-time payments)
- Vercel (deployment)
- Resend (email)

## Critical: shadcn/ui v4 uses @base-ui/react
The components in `src/components/ui/` are built on `@base-ui/react`, NOT Radix UI.
- No `asChild` prop — use `render={<Component />}` instead
- `Select` onValueChange receives `string | null` — always handle null: `(v) => v && setState(v)`
- `DropdownMenuTrigger` renders a button natively — pass children directly, no wrapper needed
- `DialogTrigger` uses `render` prop: `<DialogTrigger render={<Button />}>text</DialogTrigger>`

## Next.js 16 breaking changes
- `src/middleware.ts` is DEPRECATED — use `src/proxy.ts` with exported function named `proxy`
- Build locally with `--webpack` flag (already set in package.json scripts)
- Turbopack requires native binaries — works on personal Mac and Vercel, not on locked corporate Macs

## Architecture
```
src/
  app/
    (auth)/login, register        # Auth pages
    (dashboard)/dashboard         # Event list
    (dashboard)/events/[id]/      # guests, tables, rsvp, collaborate, settings
    (dashboard)/upgrade/          # Stripe payment page
    rsvp/[token]/                 # Public RSVP (no login)
    checkin/[token]/              # QR check-in display (no login)
    join/[token]/                 # Invite link handler
    auth/callback/                # Supabase OAuth callback
    api/upgrade/                  # Creates Stripe Checkout session
    api/webhooks/stripe/          # Stripe webhook → activates plan
  components/
    ui/                           # shadcn components (@base-ui/react)
    guests/GuestList              # Full guest CRUD + CSV import + realtime
    tables/TablePlanner           # Drag & drop with @dnd-kit
    tables/DroppableTable         # Individual table drop zone
    tables/DraggableGuest         # Draggable guest chip
    collaboration/CollaboratePanel # Members, invite links, activity feed
    rsvp/RsvpPanel                # RSVP responses + public link
    layout/DashboardNav           # Top nav with user menu
    layout/EventTabs              # Tab navigation per event
    shared/CreateEventDialog      # New event modal
    shared/EventSettings          # Edit/delete event
  lib/
    supabase/client.ts            # Browser Supabase client
    supabase/server.ts            # Server Supabase client (async cookies)
    stripe/client.ts              # Stripe instance + PLANS config
    utils.ts                      # cn(), formatDate(), isPlanActive(), etc.
  proxy.ts                        # Auth guard (Next.js 16 proxy)
  types/
    database.ts                   # All DB types (Guest, Table, Event, etc.)
    index.ts                      # Re-exports + PLAN_LIMITS config
supabase/
  schema.sql                      # Full schema — run this in Supabase SQL Editor
```

## Business logic

### Plans (stored on profiles table)
- `plan_tier`: 'free' | 'basic' | 'pro'
- `plan_expires_at`: timestamptz — null for free, 1 year from payment for paid
- Payment = one-time Stripe Checkout → webhook sets tier + expiry
- Prevents account sharing (expires after 1 year, covers full wedding planning window)

### Limits
- Free: 1 event, 75 guests, 10 tables, no collaborators, no PDF, no QR
- Basic (49 RON): 1 event, unlimited guests/tables, 1 collaborator, PDF export
- Pro (79 RON): unlimited events, unlimited collaborators, activity feed, QR check-in

### Realtime collaboration
- Supabase Realtime channels per event: `event:{eventId}`
- Tables published: guests, tables, activity_log, rsvp_responses
- Roles: owner / editor / viewer (stored in event_members)
- Join via invite_links table (token-based, role pre-set, optional expiry/max uses)

### Auth flow
- Google OAuth → /auth/callback → dashboard
- Magic link → email → /auth/callback → dashboard
- proxy.ts guards /dashboard and /events routes

## Environment variables needed
See `.env.example` for all required keys:
- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY
- SUPABASE_SERVICE_ROLE_KEY
- STRIPE_SECRET_KEY
- STRIPE_WEBHOOK_SECRET
- STRIPE_PRICE_BASIC
- STRIPE_PRICE_PRO
- NEXT_PUBLIC_APP_URL

## Coding conventions
- Romanian UI text throughout (this is a Romanian product)
- rose-600 is the primary brand color
- All Supabase queries use the typed client — keep types in sync with schema.sql
- Activity log: always write to activity_log table on guest/table mutations
- Plan gating: check PLAN_LIMITS from src/types/index.ts, never hardcode limits
