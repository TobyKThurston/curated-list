import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Curated Alcohol List',
  description: 'Checkout for Columbia Bartending curated list',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
