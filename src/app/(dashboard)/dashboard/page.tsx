import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatDate } from '@/lib/utils'
import CreateEventDialog from '@/components/shared/CreateEventDialog'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: events } = await supabase
    .from('events')
    .select(`
      *,
      members:event_members(count),
      guests:guests(count)
    `)
    .eq('owner_id', user.id)
    .order('created_at', { ascending: false })

  const { data: profile } = await supabase
    .from('profiles')
    .select('plan_tier, plan_expires_at')
    .eq('id', user.id)
    .single()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Evenimentele mele</h1>
          <p className="text-muted-foreground text-sm">
            {events?.length ?? 0} eveniment{(events?.length ?? 0) !== 1 ? 'e' : ''}
          </p>
        </div>
        <CreateEventDialog planTier={profile?.plan_tier ?? 'free'} eventCount={events?.length ?? 0} />
      </div>

      {(!events || events.length === 0) ? (
        <Card className="border-dashed border-2 border-gray-200">
          <CardContent className="py-16 text-center space-y-4">
            <div className="text-5xl">💍</div>
            <h2 className="text-xl font-semibold">Primul pas spre nunta perfectă</h2>
            <p className="text-muted-foreground max-w-sm mx-auto">
              Creează primul tău eveniment și începe să organizezi invitații și mesele.
            </p>
            <CreateEventDialog planTier={profile?.plan_tier ?? 'free'} eventCount={0} />
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {events.map((event) => (
            <Link key={event.id} href={`/events/${event.id}/guests`}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-lg leading-tight">{event.name}</CardTitle>
                    <Badge variant="outline" className="text-xs shrink-0">
                      {(event.guests as unknown as { count: number }[])?.[0]?.count ?? 0} inv.
                    </Badge>
                  </div>
                  {event.date && (
                    <CardDescription>{formatDate(event.date)}</CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  {event.venue && (
                    <p className="text-sm text-muted-foreground truncate">📍 {event.venue}</p>
                  )}
                  <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                    <span>👥 {(event.members as unknown as { count: number }[])?.[0]?.count ?? 0} colaboratori</span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {profile?.plan_tier === 'free' && (
        <Card className="border-rose-200 bg-rose-50">
          <CardContent className="py-4 flex items-center justify-between gap-4">
            <div>
              <p className="font-medium text-rose-800">Ești pe planul Gratuit</p>
              <p className="text-sm text-rose-600">Fă upgrade pentru invitați nelimitați și colaborare în timp real.</p>
            </div>
            <Link href="/upgrade">
              <Button className="shrink-0 bg-rose-600 hover:bg-rose-700">Upgrade</Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
