import type { Metadata, Viewport } from 'next'
import { Toaster } from '@/components/ui/sonner'
import { CartProvider } from '@/context/CartContext'
import './globals.css'

export const metadata: Metadata = {
  title: 'BharatDeal — Factory Prices, Direct to You',
  description: 'Buy direct from Indian factories. No middlemen. Lowest prices.',
}

export const viewport: Viewport = {
  themeColor: '#E8450A',
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
