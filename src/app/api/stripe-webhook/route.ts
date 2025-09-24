import { NextRequest } from 'next/server'
import Stripe from 'stripe'
import nodemailer from 'nodemailer'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2025-08-27.basil' as any,
  })
  const sig = req.headers.get('stripe-signature') as string
  const raw = Buffer.from(await req.arrayBuffer())

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(raw, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (e: unknown) {
    if (e instanceof Error) {
      return new Response(`Webhook Error: ${e.message}`, { status: 400 })
    }
    return new Response(`Webhook Error: Unknown`, { status: 400 })
  }

  if (event.type === 'checkout.session.completed') {
    const s = event.data.object as Stripe.Checkout.Session
    const pi = await stripe.paymentIntents.retrieve(s.payment_intent as string)

    const name = pi.metadata.name
    const eventNumber = pi.metadata.event_number
    const age21 = pi.metadata.age21
    const email = s.customer_email
    const amount = (s.amount_total ?? 0) / 100

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    })

    // ✅ Email YOU
    await transporter.sendMail({
      from: `"Curation Orders" <${process.env.EMAIL_USER}>`,
      to: process.env.NOTIFY_EMAIL || process.env.EMAIL_USER,
      subject: '🎉 New Alcohol Curation Order Paid',
      text: `
A new order has been completed:

Name: ${name}
Email: ${email}
Event Number: ${eventNumber}
Age 21+: ${age21}

Stripe Session ID: ${s.id}
Amount Paid: $${amount}
      `,
    })

    // ✅ Email the CUSTOMER
    if (email) {
      await transporter.sendMail({
        from: `"Columbia Bartending" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: 'Your Curated Alcohol List Order Confirmation',
        text: `
Hi ${name},

Thank you for your order with Columbia Bartending! 🎉

We’ve received your payment of $${amount}.
Your Event Number is: ${eventNumber}.

We’ll match your order to your event and handle logistics.
If you have any questions, just reply to this email.

– Columbia Bartending
        `,
      })
    }

    console.log('✅ Sent order emails (to you + customer)')
  }

  return new Response('ok', { status: 200 })
}
