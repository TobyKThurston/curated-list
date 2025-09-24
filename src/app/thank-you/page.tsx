import Link from 'next/link'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-08-27.basil' as any,
})

type Props = {
  searchParams: { sid?: string }
}

export default async function ThankYou({ searchParams }: Props) {
  const sid = searchParams.sid
  if (!sid) {
    return (
      <main className="min-h-screen bg-white text-black flex flex-col justify-center items-center p-6">
        <div className="bg-gray-50 border border-gray-200 rounded-2xl shadow-sm p-6 max-w-md text-center">
          <h1 className="text-2xl font-semibold mb-2">Thank you!</h1>
          <p className="text-gray-600 mb-4">Payment received. We’ll match it to your event using the Event Number.</p>
          <Link
            href="/"
            className="inline-block px-5 py-3 rounded-xl bg-black text-white hover:bg-gray-800 transition-colors"
          >
            Go Home
          </Link>
        </div>
      </main>
    )
  }

  // Fetch the checkout session & PaymentIntent from Stripe
  const session = await stripe.checkout.sessions.retrieve(sid)
  const pi = session.payment_intent
    ? await stripe.paymentIntents.retrieve(session.payment_intent as string)
    : null

  const name = pi?.metadata.name ?? 'Customer'
  const eventNumber = pi?.metadata.event_number ?? 'N/A'
  const amount = (session.amount_total ?? 0) / 100

  return (
    <div className="min-h-screen bg-white text-black flex flex-col">
      {/* Hero / Confirmation */}
      <main className="max-w-md mx-auto w-full px-6 py-20 text-center">
        <div className="bg-gray-50 border border-gray-200 rounded-2xl shadow-sm p-6 space-y-4">
          <h1 className="text-2xl font-semibold">Thank you, {name}!</h1>
          <p className="text-gray-600">
            We’ve received your payment of <strong>${amount}</strong>.
          </p>
          <p className="text-gray-600">
            Your Event Number: <strong>{eventNumber}</strong>
          </p>
          <p className="text-gray-500 text-sm">
            We’ll match your order to this event. Our agency partners will handle logistics.
          </p>
          <Link
            href="/"
            className="inline-block mt-4 px-5 py-3 rounded-xl bg-black text-white hover:bg-gray-800 transition-colors"
          >
            Go Home
          </Link>
        </div>
      </main>

      <footer className="mt-auto mb-6 text-center text-xs text-gray-400">
        © {new Date().getFullYear()} Columbia Bartending
      </footer>
    </div>
  )
}
