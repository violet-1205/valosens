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

  const [stats, setStats] = useState({ hits: 0, currentIndex: 0, total: 20 })

  const handleComplete = (data) => {
    localStorage.setItem('test3Data', JSON.stringify({ ...data, sensitivity: sensitivityMultiplier }))
    navigate('/result')
  }

  const sub = theme === 'light' ? 'text-slate-500' : 'text-slate-400'

  return (
    <Layout isTestPage={true}>
      <div
        className={`relative overflow-hidden ${
          theme === 'light' ? 'bg-[#F5F0EA]' : 'bg-[#0F1923]'
        } w-full flex-1 flex items-center justify-center`}
      >
        <TrackingSim onComplete={handleComplete} sensitivity={sensitivityMultiplier} theme={theme} onStatsChange={setStats} />

        <div className="absolute right-6 top-1/2 -translate-y-1/2 z-[1001] w-72 flex flex-col gap-3 pointer-events-none">

          {/* HUD */}
          <div className={`px-4 py-3 rounded-2xl border backdrop-blur-md shadow-lg ${
            theme === 'light' ? 'bg-white/95 border-[#DDD8D2]' : 'bg-[#1B2E3D]/90 border-[#2A3D4F]'
          }`}>
            <p className={`text-[10px] uppercase tracking-wider font-semibold mb-2 ${sub}`}>현재 현황</p>
            <div className="flex justify-between">
              <div>
                <p className={`text-[10px] ${sub}`}>Target</p>
                <p className="text-xl font-black text-[#ff4655]">
                  {Math.min(stats.currentIndex + 1, stats.total)} / {stats.total}
                </p>
              </div>
              <div>
                <p className={`text-[10px] ${sub}`}>Hits</p>
                <p className="text-xl font-black text-green-400">{stats.hits}</p>
              </div>
            </div>
          </div>

          {/* 설명 */}
          <div className={`px-4 py-4 rounded-3xl border backdrop-blur-md shadow-lg ${
            theme === 'light' ? 'bg-white/95 border-[#DDD8D2] text-[#1A1F2E]' : 'bg-[#1B2E3D]/90 border-[#2A3D4F] text-[#ECE8E1]'
          }`}>
            <p className="text-[10px] uppercase tracking-wider font-semibold text-[#ff4655] mb-1">Test 3</p>
            <h2 className="text-lg font-black mb-2 leading-snug">탭샷</h2>
            <p className={`text-sm mb-3 leading-relaxed ${theme === 'light' ? 'text-slate-600' : 'text-slate-300'}`}>
              순간적으로 등장하는 정지 타겟을 빠르게 조준하여 클릭하세요.
            </p>
            <ul className={`text-xs space-y-1 leading-relaxed ${sub}`}>
              <li>· 총 20개 타겟, 각 0.5초 제한.</li>
              <li>· 발로란트의 멈추고 쏘는 탭샷 에임 정밀도와 반응속도를 측정합니다.</li>
            </ul>
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

export default Test3
