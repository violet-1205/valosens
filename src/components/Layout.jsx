import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

function Layout({ children, isTestPage = false }) {
  const navigate = useNavigate()
  const [themeMode, setThemeMode] = useState(() => {
    const saved = localStorage.getItem('themeMode')
    if (saved === 'light' || saved === 'dark' || saved === 'system') return saved
    return 'system'
  })
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    localStorage.setItem('themeMode', themeMode)
    window.dispatchEvent(new CustomEvent('theme-change', { detail: themeMode }))
  }, [themeMode])

  const resolveTheme = (mode) => {
    if (mode === 'system') {
      return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    }
    return mode
  }

  const theme = resolveTheme(themeMode)
  const dark = theme === 'dark'

  const themeOptions = [
    {
      key: 'light',
      label: 'Light',
      icon: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2m-7.07-14.07 1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2m-4.34-7.07-1.41 1.41M6.34 17.66 4.93 19.07" />
        </svg>
      ),
    },
    {
      key: 'dark',
      label: 'Dark',
      icon: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
        </svg>
      ),
    },
    {
      key: 'system',
      label: 'System',
      icon: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="3" width="20" height="14" rx="2" />
          <path d="M8 21h8M12 17v4" />
        </svg>
      ),
    },
  ]

  const currentIcon = themeOptions.find((o) => o.key === themeMode)?.icon ?? themeOptions[2].icon

  return (
    <div className={`min-h-screen flex flex-col ${dark ? 'bg-[#0F1923] text-[#ECE8E1]' : 'bg-[#F5F0EA] text-[#1A1F2E]'}`}>
      {/* Navbar */}
      <header className={`sticky top-0 z-40 border-b backdrop-blur-md ${dark ? 'bg-[#0F1923]/90 border-[#2A3D4F]' : 'bg-[#F5F0EA]/90 border-[#DDD8D2]'}`}>
        <div className="max-w-6xl mx-auto px-5 h-14 flex items-center justify-between">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="flex items-center gap-1 group"
          >
            <span className="text-lg font-black tracking-tight">
              <span className="text-[#FF4655]">Valo</span>
              <span className={dark ? 'text-[#ECE8E1]' : 'text-[#1A1F2E]'}>Sens</span>
            </span>
          </button>

          {/* Theme Toggle */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                dark
                  ? 'text-[#768079] hover:text-[#ECE8E1] hover:bg-[#2A3D4F]'
                  : 'text-[#7A7E85] hover:text-[#1A1F2E] hover:bg-[#DDD8D2]'
              }`}
            >
              {currentIcon}
            </button>

            {menuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                <div className={`absolute right-0 top-10 z-20 w-36 rounded-2xl border shadow-xl overflow-hidden ${
                  dark ? 'bg-[#1B2E3D] border-[#2A3D4F]' : 'bg-white border-[#DDD8D2]'
                }`}>
                  {themeOptions.map((opt) => (
                    <button
                      key={opt.key}
                      type="button"
                      onClick={() => { setThemeMode(opt.key); setMenuOpen(false) }}
                      className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-sm transition-colors ${
                        themeMode === opt.key
                          ? 'text-[#FF4655] font-semibold'
                          : dark
                          ? 'text-[#768079] hover:text-[#ECE8E1] hover:bg-[#2A3D4F]/50'
                          : 'text-[#7A7E85] hover:text-[#1A1F2E] hover:bg-[#F5F0EA]'
                      }`}
                    >
                      {opt.icon}
                      {opt.label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 w-full flex flex-col">
        {isTestPage ? (
          <div className="flex-1 flex items-stretch overflow-hidden">{children}</div>
        ) : (
          <div className="w-full">{children}</div>
        )}
      </main>

      {/* Footer */}
      <footer className={`border-t ${dark ? 'border-[#2A3D4F]' : 'border-[#DDD8D2]'}`}>
        <div className="max-w-6xl mx-auto px-5 h-12 flex items-center justify-center">
          <span className={`text-xs ${dark ? 'text-[#768079]' : 'text-[#7A7E85]'}`}>
            © 2026 ValoSens
          </span>
        </div>
      </footer>
    </div>
  )
}

export default Layout
