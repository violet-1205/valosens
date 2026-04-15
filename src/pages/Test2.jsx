import { useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import Layout from '../components/Layout'
import FlickingSim from '../components/FlickingSim'

function Test2() {
  const navigate = useNavigate()
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

  const userSetup = JSON.parse(localStorage.getItem('userSetup') || '{"dpi":800,"valorantSens":0.5,"eDPI":400}')
  const sensitivityMultiplier = userSetup.eDPI / 400

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
    localStorage.setItem('test2Data', JSON.stringify({ ...data, sensitivity: sensitivityMultiplier }))
    navigate('/test3')
  }

  const sub = theme === 'light' ? 'text-slate-500' : 'text-slate-400'

  return (
    <Layout isTestPage={true}>
      <div
        className={`relative overflow-hidden ${
          theme === 'light' ? 'bg-white' : 'bg-slate-950/90'
        } w-full flex-1 flex items-center justify-center`}
      >
        <FlickingSim onComplete={handleComplete} sensitivity={sensitivityMultiplier} theme={theme} />

        <div className="absolute right-8 top-1/2 -translate-y-1/2 z-[1001] flex flex-col gap-4 items-end">
          <div
            className={`p-6 max-w-[400px] backdrop-blur-md border shadow-lg pointer-events-none text-right ${
              theme === 'light'
                ? 'bg-white/95 border-slate-200 text-slate-900'
                : 'bg-slate-900/85 border-white/10 text-white'
            }`}
          >
            <h2 className="m-0 mb-3 text-[#ff4655] font-bold text-2xl">Test 2: 코너 플릭킹</h2>
            <p className={`m-0 mb-2 ${theme === 'light' ? 'text-slate-700' : 'text-slate-200'}`}>
              좌우 코너에서 피킹하는 타겟을 빠르게 클릭하세요.
            </p>
            <p className={`m-0 text-sm ${sub}`}>
              타겟은 머리 높이 고정, 좌우 교대로 등장합니다.<br />
              30초 동안 오버슈트·언더슈트 경향을 분석합니다.
            </p>
          </div>

          {/* 감도 정보 (읽기 전용) */}
          <div
            className={`p-4 border backdrop-blur-md shadow-xl w-full ${
              theme === 'light' ? 'bg-white/95 border-slate-200' : 'bg-slate-900/90 border-white/10'
            }`}
          >
            <p className={`text-[10px] uppercase tracking-wider font-bold mb-3 ${sub}`}>
              현재 감도 설정
            </p>
            <div className="flex gap-6 justify-end">
              <div className="text-right">
                <p className={`text-[10px] ${sub}`}>DPI</p>
                <p className={`text-base font-black ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>
                  {userSetup.dpi}
                </p>
              </div>
              <div className="text-right">
                <p className={`text-[10px] ${sub}`}>감도</p>
                <p className={`text-base font-black ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>
                  {userSetup.valorantSens}
                </p>
              </div>
              <div className="text-right">
                <p className={`text-[10px] ${sub}`}>eDPI</p>
                <p className="text-base font-black text-[#ff4655]">{userSetup.eDPI}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}

export default Test2
