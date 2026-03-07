import { useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import Layout from '../components/Layout'
import FlickingSim from '../components/FlickingSim'

function Test2() {
  const navigate = useNavigate()
  const [sensitivity, setSensitivity] = useState(() => {
    const saved = localStorage.getItem('userSensitivity')
    return saved ? parseFloat(saved) : 1
  })
  const [themeMode, setThemeMode] = useState(() => {
    return localStorage.getItem('themeMode') || 'system'
  })

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

  useEffect(() => {
    const handleThemeChange = (e) => {
      setThemeMode(e.detail)
    }
    window.addEventListener('theme-change', handleThemeChange)
    return () => {
      window.removeEventListener('theme-change', handleThemeChange)
    }
  }, [])

  const handleComplete = (data) => {
    localStorage.setItem('userSensitivity', sensitivity.toString())
    localStorage.setItem('themeMode', themeMode)
    localStorage.setItem('test2Data', JSON.stringify({ ...data, sensitivity }))
    navigate('/test3')
  }

  return (
    <Layout isTestPage={true}>
      <div
        className={`relative overflow-hidden ${
          theme === 'light' ? 'bg-white' : 'bg-slate-950/90'
        } w-full flex-1 flex items-center justify-center`}
      >
        <FlickingSim onComplete={handleComplete} sensitivity={sensitivity} theme={theme} />

        <div className="absolute right-8 top-1/2 -translate-y-1/2 z-[1001] flex flex-col gap-4 items-end">
          <div
            className={`p-6 max-w-[400px] backdrop-blur-md border shadow-lg pointer-events-none text-right ${
              theme === 'light'
                ? 'bg-white/95 border-slate-200 text-slate-900'
                : 'bg-slate-900/85 border-white/10 text-white'
            }`}
          >
            <h2 className="m-0 mb-3 text-[#ff4655] font-bold text-2xl">Test 2: 정적 Flicking</h2>
            <p
              className={`m-0 mb-2 ${
                theme === 'light' ? 'text-slate-700' : 'text-slate-200'
              }`}
            >
              화면에 나타나는 붉은 타겟을 빠르게 클릭하세요.
            </p>
            <p
              className={`m-0 text-sm ${
                theme === 'light' ? 'text-slate-500' : 'text-slate-400'
              }`}
            >
              30초 동안 몇 개를 정확하게 맞추는지로 단발 플릭 에임 성향을 측정합니다.
            </p>
          </div>

          <div
            className={`p-4 border backdrop-blur-md flex items-center gap-6 shadow-xl ${
              theme === 'light' ? 'bg-white/95 border-slate-200' : 'bg-slate-900/90 border-white/10'
            }`}
          >
            <div className="flex flex-col">
              <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-1">
                Sensitivity
              </span>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="0.1"
                  max="5.0"
                  step="0.1"
                  value={sensitivity}
                  onChange={(e) => setSensitivity(parseFloat(e.target.value))}
                  className="w-32 accent-[#ff4655] cursor-pointer"
                />
                <input
                  type="number"
                  value={sensitivity}
                  onChange={(e) =>
                    setSensitivity(Math.max(0.1, parseFloat(e.target.value) || 0.1))
                  }
                  className={`w-16 border px-2 py-1 text-sm font-bold text-center ${
                    theme === 'light'
                      ? 'bg-white border-slate-300 text-slate-900'
                      : 'bg-slate-800 border-white/10 text-white'
                  }`}
                  step="0.1"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}

export default Test2

