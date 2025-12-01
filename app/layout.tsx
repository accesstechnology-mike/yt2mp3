import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'YT2MP3 — YouTube to MP3 Converter',
  description: 'Simple, effective YouTube to MP3 converter. Paste link, get highest quality MP3.',
  icons: {
    icon: '/favicon.svg',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <div className="bg-grid" />
        <div className="bg-glow" style={{ top: '30%', left: '20%' }} />
        <div className="bg-glow" style={{ top: '60%', left: '70%', animationDelay: '-4s' }} />
        {children}
      </body>
    </html>
  )
}
