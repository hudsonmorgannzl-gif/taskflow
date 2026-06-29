import { NextResponse } from 'next/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: Request) {
  const { listName } = await request.json()

  await resend.emails.send({
    from: 'onboarding@resend.dev',
    to: process.env.ADMIN_EMAIL!,
    subject: `✅ ${listName} completed!`,
    html: `<p>All tasks in <strong>${listName}</strong> have been completed for today.</p>`
  })

  return NextResponse.json({ success: true })
}
