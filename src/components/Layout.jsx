import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { setSoundVolume, getSoundVolume } from '../utils/sounds'

/* ── Volume icon (changes shape by level) ─────────────────────── */
function VolumeIcon({ volume }) {
  if (volume === 0) {
    return (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
        <line x1="23" y1="9" x2="17" y2="15" />
        <line x1="17" y1="9" x2="23" y2="15" />
      </svg>
    )
  }
  if (volume < 0.5) {
    return (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
        <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
      </svg>
    )
  }
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
      <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
      <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
    </svg>
  )
}

function Layout({ children, isTestPage = false }) {
  const navigate = useNavigate()

  /* ── Theme ───────────────────────────────────────────────────── */
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

  /* ── Volume ──────────────────────────────────────────────────── */
  const [volume, setVolumeState] = useState(() => getSoundVolume())
  const [volOpen, setVolOpen] = useState(false)
  const volRef = useRef(null)

  useEffect(() => {
    setSoundVolume(volume)
    localStorage.setItem('soundVolume', volume.toString())
  }, [volume])

  // Close volume popup on outside click
  useEffect(() => {
    if (!volOpen) return
    const handler = (e) => {
      if (volRef.current && !volRef.current.contains(e.target)) {
        setVolOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [volOpen])

  /* ── Theme options ───────────────────────────────────────────── */
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

          {/* Logo */}
          <button type="button" onClick={() => navigate('/')} className="flex items-center gap-1 group">
            <span className="text-lg font-black tracking-tight">
              <span className="text-[#FF4655]">Valo</span>
              <span className={dark ? 'text-[#ECE8E1]' : 'text-[#1A1F2E]'}>Sens</span>
            </span>
          </button>

          {/* Right controls */}
          <div className="flex items-center gap-0.5">

            {/* ── Theme Toggle ─────────────────────────────────── */}
            <div className="relative">
              <button
                type="button"
                onClick={() => { setMenuOpen((v) => !v); setVolOpen(false) }}
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                  dark
                    ? 'text-[#768079] hover:text-[#ECE8E1] hover:bg-[#2A3D4F]'
                    : 'text-[#7A7E85] hover:text-[#1A1F2E] hover:bg-[#DDD8D2]'
                }`}
              >
                {currentIcon}
              </button>

              {/* Theme dropdown */}
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

            {/* ── Volume Button ─────────────────────────────────── */}
            <div className="relative" ref={volRef}>
              <button
                type="button"
                onClick={() => { setVolOpen((v) => !v); setMenuOpen(false) }}
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                  dark
                    ? 'text-[#768079] hover:text-[#ECE8E1] hover:bg-[#2A3D4F]'
                    : 'text-[#7A7E85] hover:text-[#1A1F2E] hover:bg-[#DDD8D2]'
                }`}
              >
                <VolumeIcon volume={volume} />
              </button>

              {/* Volume popup */}
              <div
                className={`absolute right-0 top-11 z-20 w-52 rounded-2xl border shadow-xl p-4
                  transition-all duration-200 ease-out origin-top-right
                  ${dark ? 'bg-[#1B2E3D] border-[#2A3D4F]' : 'bg-white border-[#DDD8D2]'}
                  ${volOpen
                    ? 'opacity-100 scale-100 translate-y-0'
                    : 'opacity-0 scale-95 -translate-y-1 pointer-events-none'
                  }`}
              >
                {/* Header row */}
                <div className="flex items-center justify-between mb-3">
                  <span className={`text-xs font-semibold uppercase tracking-wider ${dark ? 'text-[#768079]' : 'text-[#7A7E85]'}`}>
                    효과음
                  </span>
                  <span className={`text-xs font-bold tabular-nums ${volume === 0 ? 'text-[#768079]' : 'text-[#FF4655]'}`}>
                    {volume === 0 ? 'MUTE' : `${Math.round(volume * 100)}%`}
                  </span>
                </div>

                {/* Slider row */}
                <div className="flex items-center gap-2.5">
                  {/* Mute icon */}
                  <button
                    type="button"
                    onClick={() => setVolumeState(volume === 0 ? 0.7 : 0)}
                    className={`flex-shrink-0 transition-colors ${
                      volume === 0
                        ? 'text-[#FF4655]'
                        : dark ? 'text-[#768079] hover:text-[#ECE8E1]' : 'text-[#7A7E85] hover:text-[#1A1F2E]'
                    }`}
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                      <line x1="23" y1="9" x2="17" y2="15" />
                      <line x1="17" y1="9" x2="23" y2="15" />
                    </svg>
                  </button>

                  {/* Track + thumb */}
                  <div className="relative flex-1 h-5 flex items-center">
                    {/* Track background */}
                    <div className={`absolute w-full h-1 rounded-full ${dark ? 'bg-[#2A3D4F]' : 'bg-[#E2DDD8]'}`} />
                    {/* Filled portion */}
                    <div
                      className="absolute h-1 rounded-full bg-[#FF4655] transition-all duration-75"
                      style={{ width: `${volume * 100}%` }}
                    />
                    {/* Native range (invisible, layered on top) */}
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.01"
                      value={volume}
                      onChange={(e) => setVolumeState(parseFloat(e.target.value))}
                      className="absolute w-full h-full opacity-0 cursor-pointer"
                    />
                    {/* Custom thumb */}
                    <div
                      className="absolute w-3.5 h-3.5 rounded-full bg-[#FF4655] shadow-md border-2 border-white pointer-events-none transition-all duration-75"
                      style={{ left: `calc(${volume * 100}% - 7px)` }}
                    />
                  </div>

                  {/* Max icon */}
                  <button
                    type="button"
                    onClick={() => setVolumeState(1)}
                    className={`flex-shrink-0 transition-colors ${
                      dark ? 'text-[#768079] hover:text-[#ECE8E1]' : 'text-[#7A7E85] hover:text-[#1A1F2E]'
                    }`}
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                      <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                      <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>

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
