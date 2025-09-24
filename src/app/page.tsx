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
    const data = Object.fromEntries(new FormData(form).entries())

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
      {/* Hero Section */}
      <header className="max-w-4xl mx-auto py-20 text-center">
        <h1 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">
          The Curated Alcohol List
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          A simple, elegant way to prepare for your event. One purchase, everything handled.
        </p>
      </header>

      {/* Checkout Form */}
      <main className="max-w-md mx-auto w-full px-6">
        <form
          onSubmit={onSubmit}
          className="bg-gray-50 border border-gray-200 rounded-2xl shadow-sm p-6 space-y-4"
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
            <input type="checkbox" name="age21" required /> I am 21+ (ID will be verified)
          </label>
          {err && <p className="text-sm text-red-600">{err}</p>}
          <button
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-black text-white hover:bg-gray-800 transition-colors"
          >
            {loading ? 'Redirecting…' : 'Buy Now'} <ArrowRight className="w-4 h-4" />
          </button>
          <p className="text-xs text-gray-500 text-center">
            We are not the alcohol retailer. Orders are fulfilled by licensed partners. 21+ only.
          </p>
        </form>
      </main>

      {/* Explanations with subtle animations */}
      <section className="max-w-5xl mx-auto mt-24 px-6 grid md:grid-cols-3 gap-6">
        {[
          { title: 'Effortless', desc: 'Skip the guesswork. We’ve curated exactly what you need for your event.' },
          { title: 'Reliable', desc: 'Handled by trusted partners. Delivery and ID checks guaranteed.' },
          { title: 'Elegant', desc: 'Designed to be simple, transparent, and stress-free.' },
        ].map((box, i) => (
          <motion.div
            key={box.title}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: i * 0.2 }}
            viewport={{ once: true }}
            className="bg-gray-50 border border-gray-200 rounded-2xl shadow-sm p-6"
          >
            <h3 className="text-lg font-semibold mb-2">{box.title}</h3>
            <p className="text-gray-600 text-sm">{box.desc}</p>
          </motion.div>
        ))}
      </section>

      <footer className="mt-24 mb-6 text-center text-xs text-gray-400">
        © {new Date().getFullYear()} Columbia Bartending
      </footer>
    </div>
  )
}
