import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface Props {
  params: Promise<{ token: string }>
}

export default async function CheckinPage({ params }: Props) {
  const { token } = await params
  const supabase = await createClient()

  const { data: qr } = await supabase
    .from('qr_codes')
    .select('*, guest:guests(*, table:tables(name))')
    .eq('token', token)
    .eq('type', 'checkin')
    .single()

  if (!qr || !qr.guest) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="w-full max-w-sm text-center">
          <CardContent className="py-12 space-y-2">
            <div className="text-4xl">❌</div>
            <p className="font-medium">QR invalid sau expirat</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const guest = qr.guest as typeof qr.guest & { table: { name: string } | null }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-rose-50 to-pink-50 p-4">
      <Card className="w-full max-w-sm shadow-xl border-0 text-center">
        <CardHeader>
          <div className="text-5xl mb-2">✅</div>
          <CardTitle className="text-2xl">{guest.name}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {guest.table ? (
            <div className="bg-rose-50 rounded-xl p-6 space-y-1">
              <p className="text-sm text-muted-foreground">Masa ta</p>
              <p className="text-3xl font-extrabold text-rose-600">{guest.table.name}</p>
            </div>
          ) : (
            <div className="bg-yellow-50 rounded-xl p-4">
              <p className="text-yellow-700 font-medium">Masă neaosignată încă</p>
            </div>
          )}

          <div className="flex justify-center gap-2">
            <Badge className={guest.rsvp_status === 'confirmed' ? 'bg-green-100 text-green-800 border-0' : 'bg-yellow-100 text-yellow-800 border-0'}>
              {guest.rsvp_status === 'confirmed' ? 'Confirmat' : 'În așteptare'}
            </Badge>
            {(guest.companions_count ?? (guest.has_plus_one ? 1 : 0)) > 0 && (
              <Badge variant="outline">+{guest.companions_count ?? 1} însoțitor{(guest.companions_count ?? 1) > 1 ? 'i' : ''}</Badge>
            )}
          </div>

          {guest.dietary && (
            <p className="text-sm text-muted-foreground">🥗 {guest.dietary}</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
