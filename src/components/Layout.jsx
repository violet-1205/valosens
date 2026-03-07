import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

function Layout({ children, isTestPage = false }) {
  const navigate = useNavigate()
  const [themeMode, setThemeMode] = useState(() => {
    const saved = localStorage.getItem('themeMode')
    if (saved === 'light' || saved === 'dark' || saved === 'system') {
      return saved
    }
    return 'system'
  })
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    localStorage.setItem('themeMode', themeMode)
    window.dispatchEvent(new CustomEvent('theme-change', { detail: themeMode }))
  }, [themeMode])

  const resolveTheme = (mode) => {
    if (mode === 'system') {
      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        return 'dark'
      }
      return 'light'
    }
    return mode
  }

  const theme = resolveTheme(themeMode)

  return (
    <div
      className={`h-screen flex flex-col ${
        theme === 'light' ? 'bg-white text-slate-900' : 'bg-slate-950 text-slate-50'
      }`}
    >
      <div
        className={`border-b backdrop-blur sticky top-0 z-40 ${
          theme === 'light' ? 'border-slate-200 bg-white/90' : 'border-slate-800 bg-slate-950/90'
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between relative">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="flex items-center gap-2 group"
          >
            <span
              className={`text-xl font-bold tracking-tight ${
                theme === 'light' ? 'text-slate-900' : 'text-slate-50'
              }`}
            >
              ValoSens
            </span>
          </button>
          <button
            type="button"
            className="relative flex items-center justify-center w-7 h-7 text-slate-600 hover:text-slate-900"
            onClick={() => setMenuOpen((v) => !v)}
          >
            {(() => {
              const mode = themeMode === 'light' || themeMode === 'dark' ? themeMode : 'system'
              if (mode === 'light') {
                return (
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="lucide lucide-sun"
                    aria-hidden="true"
                  >
                    <circle cx="12" cy="12" r="4" />
                    <path d="M12 2v2" />
                    <path d="M12 20v2" />
                    <path d="m4.93 4.93 1.41 1.41" />
                    <path d="m17.66 17.66 1.41 1.41" />
                    <path d="M2 12h2" />
                    <path d="M20 12h2" />
                    <path d="m6.34 17.66-1.41 1.41" />
                    <path d="m19.07 4.93-1.41 1.41" />
                  </svg>
                )
              }
              if (mode === 'dark') {
                return (
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="lucide lucide-moon"
                    aria-hidden="true"
                  >
                    <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
                  </svg>
                )
              }
              return (
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="lucide lucide-laptop"
                  aria-hidden="true"
                >
                  <path d="M18 5a2 2 0 0 1 2 2v8.526a2 2 0 0 0 .212.897l1.068 2.127a1 1 0 0 1-.9 1.45H3.62a1 1 0 0 1-.9-1.45l1.068-2.127A2 2 0 0 0 4 15.526V7a2 2 0 0 1 2-2z" />
                  <path d="M20.054 15.987H3.946" />
                </svg>
              )
            })()}
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-[52px] w-40 bg-white border border-slate-200 shadow-lg text-[12px] text-slate-800">
              <button
                type="button"
                onClick={() => {
                  setThemeMode('light')
                  setMenuOpen(false)
                }}
                className="w-full flex items-center gap-2 px-3 py-2 hover:bg-slate-50"
              >
                <span className="w-3 text-center">
                  {themeMode === 'light' ? '●' : ''}
                </span>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="lucide lucide-sun"
                  aria-hidden="true"
                >
                  <circle cx="12" cy="12" r="4" />
                  <path d="M12 2v2" />
                  <path d="M12 20v2" />
                  <path d="m4.93 4.93 1.41 1.41" />
                  <path d="m17.66 17.66 1.41 1.41" />
                  <path d="M2 12h2" />
                  <path d="M20 12h2" />
                  <path d="m6.34 17.66-1.41 1.41" />
                  <path d="m19.07 4.93-1.41 1.41" />
                </svg>
                <span>Light</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setThemeMode('dark')
                  setMenuOpen(false)
                }}
                className="w-full flex items-center gap-2 px-3 py-2 hover:bg-slate-50"
              >
                <span className="w-3 text-center">
                  {themeMode === 'dark' ? '●' : ''}
                </span>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="lucide lucide-moon"
                  aria-hidden="true"
                >
                  <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
                </svg>
                <span>Dark</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setThemeMode('system')
                  setMenuOpen(false)
                }}
                className="w-full flex items-center gap-2 px-3 py-2 hover:bg-slate-50"
              >
                <span className="w-3 text-center">
                  {themeMode === 'system' ? '●' : ''}
                </span>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="lucide lucide-laptop"
                  aria-hidden="true"
                >
                  <path d="M18 5a2 2 0 0 1 2 2v8.526a2 2 0 0 0 .212.897l1.068 2.127a1 1 0 0 1-.9 1.45H3.62a1 1 0 0 1-.9-1.45l1.068-2.127A2 2 0 0 0 4 15.526V7a2 2 0 0 1 2-2z" />
                  <path d="M20.054 15.987H3.946" />
                </svg>
                <span>System</span>
              </button>
            </div>
          )}
        </div>
      </div>
      <main className="flex-1 w-full flex flex-col overflow-hidden">
        {isTestPage ? (
          <div className="flex-1 flex items-stretch overflow-hidden">
            {children}
          </div>
        ) : (
          <div className="w-full max-w-7xl mx-auto px-6 py-16">{children}</div>
        )}
      </main>
      <div
        className={`border-t ${
          theme === 'light' ? 'border-slate-200 bg-white/80' : 'border-slate-800 bg-slate-950/80'
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between text-[11px]">
          <span className={theme === 'light' ? 'text-slate-500' : 'text-slate-400'}>
            © 2026 ValoSens. All rights reserved.
          </span>
        </div>
      </div>
    </div>
  )
}

export default Layout

