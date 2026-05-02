import type { Metadata, Viewport } from 'next'
import { Toaster } from '@/components/ui/sonner'
import { CartProvider } from '@/context/CartContext'
import './globals.css'

const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://bharatdeal.in'

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: {
    default: 'BharatDeal — Factory Prices, Direct to You',
    template: '%s | BharatDeal',
  },
  description: 'Buy factory-direct from Indian manufacturers. Best prices on clothing, home decor, gifts & more. COD available. Free delivery.',
  keywords: 'factory direct, cheap prices, buy online India, clothing, home decor, COD, free delivery, BharatDeal',
  authors: [{ name: 'BharatDeal' }],
  creator: 'BharatDeal',
  publisher: 'BharatDeal',
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large' },
  },
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: appUrl,
    siteName: 'BharatDeal',
    title: 'BharatDeal — Factory Prices, Direct to You',
    description: 'Buy factory-direct from Indian manufacturers. Best prices on clothing, home decor, gifts & more.',
    images: [{ url: '/og-default.jpg', width: 1200, height: 630, alt: 'BharatDeal — Factory Direct Shopping' }],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@bharatdeal',
    creator: '@bharatdeal',
    title: 'BharatDeal — Factory Prices, Direct to You',
    description: 'Buy factory-direct from Indian manufacturers. Best prices guaranteed.',
    images: ['/og-default.jpg'],
  },
  alternates: { canonical: appUrl },
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION,
  },
}

export const viewport: Viewport = {
  themeColor: '#E8450A',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full flex flex-col antialiased">
        <CartProvider>
          {children}
        </CartProvider>
        <Toaster position="top-center" richColors />
      </body>
    </html>
  )
}
