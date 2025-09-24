import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { z } from 'zod'

export const runtime = 'nodejs'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-08-27.basil' as any, // pin to your Stripe version
})

const Body = z.object({
  name: z.string().min(1).max(120),
  email: z.string().email(),
  event_number: z.string().min(1).max(80),
  age21: z.boolean()
})

export async function POST(req: NextRequest) {
  try {
    const json = await req.json()
    const body = Body.parse(json)

    const idempotencyKey = `${body.event_number}:${crypto.randomUUID()}`

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      customer_email: body.email,
      line_items: [{ price: process.env.PRICE_CURATED!, quantity: 1 }],
      success_url: `${process.env.BASE_URL}/thank-you?sid={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.BASE_URL}/`,

      // ✅ Attach metadata to the PaymentIntent instead of the session
      payment_intent_data: {
        metadata: {
          event_number: body.event_number,
          name: body.name,
          age21: String(body.age21),
        },
      },
    }, { idempotencyKey })

    return NextResponse.json({ id: session.id, url: session.url })
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues.map(i => i.message).join(', ') }, { status: 400 })
    }
    console.error('checkout_error', err)
    return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 })
  }
}
