'use client'
import { useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'

export default function Page() {
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setErr(null)

    const form = e.currentTarget
    const data = Object.fromEntries(
      new FormData(form).entries()
    ) as Record<string, string>

    try {
      const r = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: data.name,
          email: data.email,
          event_number: data.event_number,
          age21: data.age21 === 'on',
        }),
      })

      const j: { error?: string; url?: string } = await r.json()
      if (!r.ok || !j.url) throw new Error(j.error || 'Checkout failed')
      window.location.href = j.url
    } catch (e: unknown) {
      if (e instanceof Error) {
        setErr(e.message)
      } else {
        setErr('Checkout failed')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-white text-black flex flex-col">
      {/* Top Navbar - Solid Black, Slimmer */}
      <motion.nav
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="w-full fixed top-0 left-0 bg-black text-white h-12 flex items-center px-6 shadow-md z-50"
      >
        <div className="font-bold tracking-wide text-lg">
          Glasslist NYC
        </div>
      </motion.nav>

      {/* Hero Section with Shorter Gradient */}
      <header className="w-full bg-gradient-to-b from-black via-gray-900/80 to-white text-center text-white pt-28 pb-16 px-6">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-5xl md:text-6xl font-bold tracking-tight"
        >
          Liquor & Bar Coordination
        </motion.h1>
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-2xl md:text-3xl text-gray-200 mt-2 font-semibold"
        >
          for Your CBA Event.
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
          className="text-sm italic text-gray-300 mt-4"
        >
          Powered by Glasslist NYC
        </motion.p>
      </header>

      {/* Checkout Form - fully in white section */}
      <main className="max-w-md mx-auto w-full px-6 mt-6 relative z-10">
        <motion.form
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          onSubmit={onSubmit}
          className="bg-gray-50 border border-gray-200 rounded-2xl shadow-xl p-6 space-y-4"
        >
          <div>
            <label className="block text-sm font-medium mb-1">Name</label>
            <input
              name="name"
              required
              className="w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-black"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              name="email"
              required
              className="w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-black"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Event Number</label>
            <input
              name="event_number"
              required
              className="w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-black"
            />
          </div>
          <label className="inline-flex items-center gap-2 text-sm">
            <input type="checkbox" name="age21" required /> I am at least 21 years of age
          </label>
          {err && <p className="text-sm text-red-600">{err}</p>}
          <button
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-black text-white hover:bg-gray-800 transition-colors"
          >
            {loading ? 'Redirecting…' : 'Buy Now'} <ArrowRight className="w-4 h-4" />
          </button>
        </motion.form>
      </main>

      {/* Intro Paragraph Below Form */}
      <section className="max-w-2xl mx-auto mt-12 px-6 text-gray-700 text-center">
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-lg text-gray-600"
        >
          Our team works directly with your bartenders to plan & deliver everything you need for your event, exactly when you want it.
        </motion.p>
      </section>

      {/* Details Section */}
      <section className="max-w-2xl mx-auto mt-10 px-6 text-gray-700">
        <p className="font-medium mb-2">This means:</p>
        <ul className="list-disc pl-6 space-y-3 mb-8 leading-relaxed">
          <li>No shopping. No guesswork. No last-minute errands.</li>
          <li>Spirits, garnishes, mixers & ice dropped right at your door.</li>
          <li>Delivery exactly when you want it, whether that is weeks or hours before guests arrive.</li>
          <li>Your bartender walks in ready to go — and you get to enjoy your own party.</li>
        </ul>
        <p className="font-semibold mt-6">
          CBA Clients receive $50 off every order. This pricing is already included in your quote from the Columbia Bartending Agency.
        </p>
      </section>

      {/* How it Works Section */}
      <section className="max-w-3xl mx-auto mt-16 px-6">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-2xl font-bold mb-6 text-center"
        >
          How it Works
        </motion.h2>
        <div className="space-y-6">
          {[
            'Confirm your delivery with your CBA Event Reference Number (ex: 000H).',
            'Pay our discounted service fee, already included in your quote from CBA.',
            'We work with your CBA bartender to build 3 potential carts, from affordable liquors to top-shelf spirits. We keep working until your cart is perfect.',
            'Schedule your delivery.',
            'Enjoy your exceptional event.',
          ].map((step, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: i * 0.2 }}
              viewport={{ once: true }}
              className={`flex gap-4 items-start p-4 rounded-lg ${i % 2 === 0 ? 'bg-gray-50' : 'bg-white'}`}
            >
              <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-black text-white font-semibold">
                {i + 1}
              </div>
              <p className="text-gray-700 leading-relaxed">{step}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Disclaimer Section */}
      <section className="max-w-3xl mx-auto mt-12 px-6 text-gray-500 text-sm text-center border-t pt-6">
        <p>
          <span className="font-semibold">Disclaimer:</span> The Glasslist NYC does not sell or distribute alcoholic beverages. All alcohol orders are processed and fulfilled exclusively by duly licensed third-party retailers or distributors.
        </p>
      </section>

      <footer className="mt-16 mb-6 text-center text-xs text-gray-400">
        © {new Date().getFullYear()} GlassList NYC
      </footer>
    </div>
  )
}