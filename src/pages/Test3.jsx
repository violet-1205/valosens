import { useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import Layout from '../components/Layout'
import TrackingSim from '../components/TrackingSim'

function Test3() {
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
    localStorage.setItem('test3Data', JSON.stringify({ ...data, sensitivity: sensitivityMultiplier }))
    navigate('/result')
  }

  const sub = theme === 'light' ? 'text-slate-500' : 'text-slate-400'

  return (
    <Layout isTestPage={true}>
      <div
        className={`relative overflow-hidden ${
          theme === 'light' ? 'bg-white' : 'bg-slate-950/90'
        } w-full flex-1 flex items-center justify-center`}
      >
        <TrackingSim onComplete={handleComplete} sensitivity={sensitivityMultiplier} theme={theme} />

        <div className="absolute right-8 top-1/2 -translate-y-1/2 z-[1001] flex flex-col gap-4 items-end">
          <div
            className={`p-6 max-w-[400px] backdrop-blur-md border shadow-lg pointer-events-none text-right ${
              theme === 'light'
                ? 'bg-white/95 border-slate-200 text-slate-900'
                : 'bg-slate-900/85 border-white/10 text-white'
            }`}
          >
            <h2 className="m-0 mb-3 text-[#ff4655] font-bold text-2xl">Test 3: 탭샷</h2>
            <p className={`m-0 mb-2 ${theme === 'light' ? 'text-slate-700' : 'text-slate-200'}`}>
              순간적으로 등장하는 정지 타겟을 빠르게 조준하여 클릭하세요.
            </p>
            <p className={`m-0 text-sm ${sub}`}>
              총 20개 타겟, 각 1.5초 제한.<br />
              발로란트의 멈추고 쏘는 탭샷 에임 정밀도와 반응속도를 측정합니다.
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

export default Test3
