import { useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import Layout from '../components/Layout'
import RotationSim from '../components/RotationSim'

function Test1() {
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

  // 감도 설정 읽기 (Home에서 저장한 값)
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
    localStorage.setItem('test1Data', JSON.stringify({ ...data, sensitivity: sensitivityMultiplier }))
    navigate('/test2')
  }

  const sub = theme === 'light' ? 'text-slate-500' : 'text-slate-400'

  return (
    <Layout isTestPage={true}>
      <div
        className={`relative overflow-hidden ${
          theme === 'light' ? 'bg-[#F5F0EA]' : 'bg-[#0F1923]'
        } w-full flex-1 flex items-center justify-center`}
      >
        <RotationSim onComplete={handleComplete} sensitivity={sensitivityMultiplier} theme={theme} />

        <div className="absolute right-8 top-1/2 -translate-y-1/2 z-[1002] flex flex-col gap-4 items-end">
          <div
            className={`p-6 max-w-[440px] rounded-3xl backdrop-blur-md border shadow-xl pointer-events-none ${
              theme === 'light'
                ? 'bg-white/95 border-[#DDD8D2] text-[#1A1F2E]'
                : 'bg-[#1B2E3D]/90 border-[#2A3D4F] text-[#ECE8E1]'
            }`}
          >
            <h2 className="m-0 mb-3 text-[#ff4655] font-bold text-2xl">
              Test 1: 360° 회전 정밀도
            </h2>
            <p className={`m-0 mb-2 ${theme === 'light' ? 'text-slate-700' : 'text-slate-200'}`}>
              3D FPS 시점에서 360° 회전 후 원점에 정확히 돌아오는 능력을 측정합니다.
            </p>
            <p className={`m-0 text-sm mt-2 ${sub}`}>
              1. 시작 지점을 클릭합니다.<br />
              2. 360°를 회전하여 다시 시작 지점을 바라봅니다.<br />
              3. 다시 클릭하여 종료합니다.<br />
              <span className="text-[#ff4655]">정확히 360° 돌아올수록 각도 편차가 낮아집니다.</span>
            </p>
          </div>

          {/* 감도 정보 (읽기 전용) */}
          <div
            className={`p-4 rounded-2xl border backdrop-blur-md shadow-xl w-full ${
              theme === 'light' ? 'bg-white/95 border-[#DDD8D2]' : 'bg-[#1B2E3D]/90 border-[#2A3D4F]'
            }`}
          >
            <p className={`text-[10px] uppercase tracking-wider font-bold mb-3 ${sub}`}>
              현재 감도 설정
            </p>
            <div className="flex gap-6">
              <div>
                <p className={`text-[10px] ${sub}`}>DPI</p>
                <p className={`text-base font-black ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>
                  {userSetup.dpi}
                </p>
              </div>
              <div>
                <p className={`text-[10px] ${sub}`}>감도</p>
                <p className={`text-base font-black ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>
                  {userSetup.valorantSens}
                </p>
              </div>
              <div>
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

export default Test1
