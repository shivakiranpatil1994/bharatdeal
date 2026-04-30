import Link from 'next/link'
import { PackageSearch } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 text-center" style={{ background: '#0F0F14' }}>
      <div className="w-20 h-20 rounded-full bg-[var(--bg-elevated)] flex items-center justify-center mb-6">
        <PackageSearch className="w-10 h-10 text-[var(--text-tertiary)]" />
      </div>
      <h1 className="font-['Syne',sans-serif] text-2xl font-700 text-[var(--text-primary)] mb-2">
        Page not found
      </h1>
      <p className="text-sm text-[var(--text-secondary)] mb-6 max-w-xs">
        The page you are looking for doesn't exist or has been moved.
      </p>
      <Link
        href="/"
        className="px-6 py-3 bg-[var(--brand-primary)] hover:bg-orange-600 text-white text-sm font-semibold rounded-xl transition-all duration-200"
      >
        Back to deals
      </Link>
    </div>
  )
}
