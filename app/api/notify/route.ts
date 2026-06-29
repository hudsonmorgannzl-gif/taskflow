import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const { message } = await request.json()
  console.log('Notification:', message)
  return NextResponse.json({ success: true })
}
