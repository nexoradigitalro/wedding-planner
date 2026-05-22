import { Resend } from 'resend'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const resend = new Resend(process.env.RESEND_API_KEY)
  const { name, email, message } = await request.json()

  if (!name || !email || !message) {
    return NextResponse.json({ error: 'Câmpuri lipsă' }, { status: 400 })
  }

  const { error } = await resend.emails.send({
    from: 'Planner Nuntă <salut@plannernunta.ro>',
    to: 'axdigitalro@gmail.com',
    replyTo: email,
    subject: `[Suport] Mesaj de la ${name}`,
    html: `
      <div style="font-family: Georgia, serif; max-width: 480px; margin: 0 auto; padding: 32px 24px;">
        <h2 style="color: #1a1a1a; margin: 0 0 16px;">Mesaj nou de suport</h2>
        <p style="color: #6b7280; font-size: 14px; margin: 0 0 24px;">Primit prin formularul din aplicație.</p>
        <table style="width: 100%; border-collapse: collapse;">
          <tr><td style="padding: 8px 0; color: #9ca3af; font-size: 13px; width: 80px;">Nume</td><td style="padding: 8px 0; color: #1a1a1a; font-size: 14px;">${name}</td></tr>
          <tr><td style="padding: 8px 0; color: #9ca3af; font-size: 13px;">Email</td><td style="padding: 8px 0; color: #e11d48; font-size: 14px;">${email}</td></tr>
        </table>
        <div style="margin-top: 20px; padding: 16px; background: #f9fafb; border-radius: 12px; border-left: 3px solid #e11d48;">
          <p style="color: #1a1a1a; font-size: 14px; line-height: 1.6; margin: 0;">${message.replace(/\n/g, '<br>')}</p>
        </div>
        <p style="color: #9ca3af; font-size: 12px; margin-top: 24px;">Răspunde direct la acest email pentru a contacta utilizatorul.</p>
      </div>
    `,
  })

  if (error) {
    return NextResponse.json({ error: 'Eroare la trimitere' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
