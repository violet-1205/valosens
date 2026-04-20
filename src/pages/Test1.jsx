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

  const [movement, setMovement] = useState(0)

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
        <RotationSim onComplete={handleComplete} sensitivity={sensitivityMultiplier} theme={theme} onMovementChange={setMovement} />

        <div className="absolute right-6 top-1/2 -translate-y-1/2 z-[1002] w-72 flex flex-col gap-3 pointer-events-none">

          {/* HUD */}
          <div className={`px-4 py-3 rounded-2xl border backdrop-blur-md shadow-lg ${
            theme === 'light' ? 'bg-white/95 border-[#DDD8D2]' : 'bg-[#1B2E3D]/90 border-[#2A3D4F]'
          }`}>
            <p className={`text-[10px] uppercase tracking-wider font-semibold mb-2 ${sub}`}>현재 이동량</p>
            <div className="flex items-baseline gap-1">
              <span className={`text-xl font-black ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>{movement.toFixed(0)}</span>
              <span className={`text-xs ${sub}`}>px</span>
            </div>
          </div>

          {/* 설명 */}
          <div className={`px-4 py-4 rounded-3xl border backdrop-blur-md shadow-lg ${
            theme === 'light' ? 'bg-white/95 border-[#DDD8D2] text-[#1A1F2E]' : 'bg-[#1B2E3D]/90 border-[#2A3D4F] text-[#ECE8E1]'
          }`}>
            <p className="text-[10px] uppercase tracking-wider font-semibold text-[#ff4655] mb-1">Test 1</p>
            <h2 className="text-lg font-black mb-2 leading-snug">360° 회전 정밀도</h2>
            <p className={`text-sm mb-3 leading-relaxed ${theme === 'light' ? 'text-slate-600' : 'text-slate-300'}`}>
              3D FPS 시점에서 360° 회전 후 원점에 정확히 돌아오는 능력을 측정합니다.
            </p>
            <ol className={`text-xs space-y-1 leading-relaxed ${sub}`}>
              <li>1. 시작 지점을 클릭합니다.</li>
              <li>2. 360° 회전 후 다시 같은 지점을 바라봅니다.</li>
              <li>3. 클릭하면 편차가 측정됩니다.</li>
            </ol>
            <p className="text-xs text-[#ff4655] mt-2 font-medium">정확히 돌아올수록 각도 편차가 낮아집니다.</p>
          </div>

          {/* 감도 */}
          <div className={`px-4 py-3 rounded-2xl border backdrop-blur-md shadow-lg ${
            theme === 'light' ? 'bg-white/95 border-[#DDD8D2]' : 'bg-[#1B2E3D]/90 border-[#2A3D4F]'
          }`}>
            <p className={`text-[10px] uppercase tracking-wider font-semibold mb-2 ${sub}`}>현재 감도 설정</p>
            <div className="flex justify-between">
              <div>
                <p className={`text-[10px] ${sub}`}>DPI</p>
                <p className={`text-sm font-black ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>{userSetup.dpi}</p>
              </div>
              <div>
                <p className={`text-[10px] ${sub}`}>감도</p>
                <p className={`text-sm font-black ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>{userSetup.valorantSens}</p>
              </div>
              <div>
                <p className={`text-[10px] ${sub}`}>eDPI</p>
                <p className="text-sm font-black text-[#ff4655]">{userSetup.eDPI}</p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </Layout>
  )
}

export default Test1
