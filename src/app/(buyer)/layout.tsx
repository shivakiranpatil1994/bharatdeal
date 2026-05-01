import { BuyerHeader } from '@/components/buyer/BuyerHeader'
import { MobileNav } from '@/components/buyer/MobileNav'

export default function BuyerLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#F5F5F5] pb-16 sm:pb-0">
      <BuyerHeader />
      <main className="max-w-screen-xl mx-auto px-3 sm:px-4 py-6">
        {children}
      </main>
      <MobileNav />
    </div>
  )
}
