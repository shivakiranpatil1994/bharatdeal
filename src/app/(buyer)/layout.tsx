export default function BuyerLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen" style={{ background: '#0F0F14' }}>
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-[var(--bg-border)] bg-[#0F0F14]/95 backdrop-blur-sm">
        <div className="max-w-screen-xl mx-auto px-4 h-14 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2">
            <span className="font-['Syne',sans-serif] text-xl font-800 text-[var(--brand-primary)] tracking-tight">
              Bharat<span className="text-[var(--text-primary)]">Deal</span>
            </span>
          </a>
          <div className="flex items-center gap-3">
            <span className="text-xs text-[var(--text-tertiary)]">🇮🇳 Factory Direct</span>
          </div>
        </div>
      </header>

      <main className="max-w-screen-xl mx-auto px-3 sm:px-4 py-4">
        {children}
      </main>
    </div>
  )
}
