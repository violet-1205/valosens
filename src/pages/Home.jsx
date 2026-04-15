import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'

const DPI_PRESETS = [400, 800, 1600, 3200]

function SetupModal({ theme, onClose, onConfirm }) {
  const [dpi, setDpi] = useState(() => {
    const saved = localStorage.getItem('userSetup')
    return saved ? JSON.parse(saved).dpi : 800
  })
  const [valorantSens, setValorantSens] = useState(() => {
    const saved = localStorage.getItem('userSetup')
    return saved ? JSON.parse(saved).valorantSens : 0.5
  })

  const eDPI = Math.round(dpi * valorantSens)
  const cmPer360 = (360 / (valorantSens * 0.07 * dpi / 2.54)).toFixed(1)

  const handleSensChange = (val) => {
    const n = parseFloat(val)
    if (!isNaN(n)) setValorantSens(Math.max(0.01, Math.min(10, n)))
  }

  const handleDpiInput = (val) => {
    const n = parseInt(val)
    if (!isNaN(n) && n > 0) setDpi(n)
  }

  const card = theme === 'light'
    ? 'bg-white border-slate-200 text-slate-900'
    : 'bg-slate-900 border-slate-700 text-white'
  const sub = theme === 'light' ? 'text-slate-500' : 'text-slate-400'
  const inp = theme === 'light'
    ? 'bg-white border-slate-300 text-slate-900'
    : 'bg-slate-800 border-slate-600 text-white'
  const presetBase = 'px-3 py-1.5 text-sm font-bold border transition-all'
  const presetActive = 'bg-[#ff4655] border-[#ff4655] text-white'
  const presetInactive = theme === 'light'
    ? 'border-slate-300 text-slate-600 hover:border-[#ff4655] hover:text-[#ff4655]'
    : 'border-slate-600 text-slate-400 hover:border-[#ff4655] hover:text-[#ff4655]'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className={`w-full max-w-md border shadow-2xl p-8 ${card}`}>
        {/* Header */}
        <h2 className="text-2xl font-black mb-1">현재 감도 설정</h2>
        <p className={`text-sm mb-8 ${sub}`}>
          지금 발로란트에서 사용 중인 DPI와 인게임 감도를 입력하세요.
        </p>

        {/* DPI */}
        <div className="mb-6">
          <label className={`block text-xs font-bold uppercase tracking-widest mb-3 ${sub}`}>
            DPI
          </label>
          <div className="flex gap-2 mb-3">
            {DPI_PRESETS.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setDpi(preset)}
                className={`${presetBase} ${dpi === preset ? presetActive : presetInactive}`}
              >
                {preset}
              </button>
            ))}
          </div>
          <input
            type="number"
            value={dpi}
            onChange={(e) => handleDpiInput(e.target.value)}
            className={`w-full border px-3 py-2 text-sm font-bold ${inp}`}
            placeholder="직접 입력"
            min="100"
            max="32000"
          />
        </div>

        {/* Valorant Sensitivity */}
        <div className="mb-8">
          <label className={`block text-xs font-bold uppercase tracking-widest mb-3 ${sub}`}>
            발로란트 인게임 감도
          </label>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => handleSensChange((valorantSens - 0.01).toFixed(2))}
              className={`w-10 h-10 flex items-center justify-center text-xl font-bold border transition-all ${
                theme === 'light'
                  ? 'border-slate-300 text-slate-600 hover:border-[#ff4655] hover:text-[#ff4655]'
                  : 'border-slate-600 text-slate-400 hover:border-[#ff4655] hover:text-[#ff4655]'
              }`}
            >
              −
            </button>
            <input
              type="number"
              value={valorantSens}
              onChange={(e) => handleSensChange(e.target.value)}
              className={`flex-1 border px-3 py-2 text-center text-xl font-black ${inp}`}
              step="0.01"
              min="0.01"
              max="10"
            />
            <button
              type="button"
              onClick={() => handleSensChange((valorantSens + 0.01).toFixed(2))}
              className={`w-10 h-10 flex items-center justify-center text-xl font-bold border transition-all ${
                theme === 'light'
                  ? 'border-slate-300 text-slate-600 hover:border-[#ff4655] hover:text-[#ff4655]'
                  : 'border-slate-600 text-slate-400 hover:border-[#ff4655] hover:text-[#ff4655]'
              }`}
            >
              +
            </button>
          </div>
        </div>

        {/* Live Preview */}
        <div className={`flex justify-between items-center mb-8 px-4 py-4 border ${
          theme === 'light' ? 'bg-slate-50 border-slate-200' : 'bg-slate-800 border-slate-700'
        }`}>
          <div className="text-center">
            <p className={`text-xs uppercase tracking-widest mb-1 ${sub}`}>eDPI</p>
            <p className="text-2xl font-black text-[#ff4655]">{eDPI}</p>
          </div>
          <div className={`w-px h-10 ${theme === 'light' ? 'bg-slate-200' : 'bg-slate-700'}`} />
          <div className="text-center">
            <p className={`text-xs uppercase tracking-widest mb-1 ${sub}`}>cm / 360°</p>
            <p className={`text-2xl font-black ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>
              {cmPer360}
            </p>
          </div>
          <div className={`w-px h-10 ${theme === 'light' ? 'bg-slate-200' : 'bg-slate-700'}`} />
          <div className="text-center">
            <p className={`text-xs uppercase tracking-widest mb-1 ${sub}`}>수준</p>
            <p className={`text-sm font-bold ${
              eDPI < 300 ? 'text-blue-400' :
              eDPI < 500 ? 'text-green-400' :
              eDPI < 800 ? 'text-yellow-400' : 'text-red-400'
            }`}>
              {eDPI < 300 ? '저감도' : eDPI < 500 ? '중저감도' : eDPI < 800 ? '중고감도' : '고감도'}
            </p>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className={`flex-1 py-3 border font-bold text-sm transition-all ${
              theme === 'light'
                ? 'border-slate-300 text-slate-600 hover:bg-slate-50'
                : 'border-slate-600 text-slate-400 hover:bg-slate-800'
            }`}
          >
            취소
          </button>
          <button
            type="button"
            onClick={() => onConfirm({ dpi, valorantSens, eDPI })}
            className="flex-1 py-3 bg-[#ff4655] text-white font-bold text-sm hover:bg-[#ff4655]/90 transition-all"
          >
            이 감도로 테스트 시작
          </button>
        </div>
      </div>
    </div>
  )
}

function Home() {
  const navigate = useNavigate()
  const [showSetup, setShowSetup] = useState(false)
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

  const handleConfirm = ({ dpi, valorantSens, eDPI }) => {
    localStorage.setItem('userSetup', JSON.stringify({ dpi, valorantSens, eDPI }))
    // sensitivityMultiplier = eDPI / 400 (기준: eDPI 400 = multiplier 1.0)
    localStorage.setItem('userSensitivity', (eDPI / 400).toString())
    navigate('/test1')
  }

  return (
    <Layout>
      {showSetup && (
        <SetupModal
          theme={theme}
          onClose={() => setShowSetup(false)}
          onConfirm={handleConfirm}
        />
      )}

      <div className="max-w-7xl mx-auto px-6 pt-16 pb-16 text-center">
        <div className="inline-flex items-center justify-center gap-2 px-4 py-1.5 mb-4 mx-auto bg-slate-900 text-slate-200 shadow-sm">
          <span className="w-2 h-2 bg-emerald-400" />
          <span className="text-xs font-medium tracking-[0.16em] uppercase text-slate-300">
            Valorant Sensitivity Lab
          </span>
        </div>

        <h1
          className={`text-3xl md:text-4xl font-extrabold tracking-tight mb-3 leading-tight ${
            theme === 'light' ? 'text-slate-900' : 'text-slate-50'
          }`}
        >
          플레이어의 에임 성장을 위한 감도 측정 시뮬레이션
        </h1>

        <p
          className={`text-base md:text-lg max-w-xl mx-auto mb-8 leading-relaxed ${
            theme === 'light' ? 'text-slate-600' : 'text-slate-300'
          }`}
        >
          3D 시뮬레이션으로 회전, 플릭, 탭샷을 각각 측정해서<br />
          지금 감도와 플레이 스타일이 얼마나 맞는지 숫자로 확인해 보세요.
        </p>

        <button
          onClick={() => setShowSetup(true)}
          className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-normal shadow-lg hover:shadow-slate-700/40 transition-all duration-300 transform hover:-translate-y-0.5 text-lg"
        >
          감도 측정 시뮬레이션 시작
        </button>
      </div>

      {/* Features Grid */}
      <div className="max-w-7xl mx-auto px-6 py-24 grid grid-cols-1 md:grid-cols-3 gap-12">
        <div
          className={`p-8 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 border ${
            theme === 'light' ? 'bg-white border-slate-100' : 'bg-slate-900 border-slate-800'
          }`}
        >
          <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center mb-6">
            <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 11a8 8 0 0 1 12.5-6.5" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16.5 4.5H21v4.5" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13a8 8 0 0 1-12.5 6.5" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7.5 19.5H3V15" />
            </svg>
          </div>
          <h3 className={`text-xl font-bold mb-4 ${theme === 'light' ? 'text-slate-900' : 'text-slate-50'}`}>
            Test 1: 360° 회전 정밀도
          </h3>
          <p className={`leading-relaxed ${theme === 'light' ? 'text-slate-500' : 'text-slate-400'}`}>
            360° 회전 후 원점 복귀 정확도를 측정합니다. 각도 편차로 감도 제어력을 확인합니다.
          </p>
        </div>

        <div
          className={`p-8 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 border ${
            theme === 'light' ? 'bg-white border-slate-100' : 'bg-slate-900 border-slate-800'
          }`}
        >
          <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center mb-6">
            <svg className="w-6 h-6 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="6" strokeWidth="2" />
              <circle cx="12" cy="12" r="3" strokeWidth="2" />
              <path strokeWidth="2" strokeLinecap="round" d="M12 3v3M12 18v3M3 12h3M18 12h3" />
            </svg>
          </div>
          <h3 className={`text-xl font-bold mb-4 ${theme === 'light' ? 'text-slate-900' : 'text-slate-50'}`}>
            Test 2: 코너 플릭킹
          </h3>
          <p className={`leading-relaxed ${theme === 'light' ? 'text-slate-500' : 'text-slate-400'}`}>
            머리 높이 고정, 좌우 교대로 등장하는 타겟을 플릭합니다. 오버슈트/언더슈트 경향을 분석합니다.
          </p>
        </div>

        <div
          className={`p-8 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 border ${
            theme === 'light' ? 'bg-white border-slate-100' : 'bg-slate-900 border-slate-800'
          }`}
        >
          <div className="w-12 h-12 bg-violet-50 rounded-2xl flex items-center justify-center mb-6">
            <svg className="w-6 h-6 text-violet-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="3" strokeWidth="2" />
              <path strokeWidth="2" strokeLinecap="round" d="M12 2v4M12 18v4M2 12h4M18 12h4" />
              <path strokeWidth="2" strokeLinecap="round" d="M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M5.6 18.4l2.8-2.8M15.6 8.4l2.8-2.8" />
            </svg>
          </div>
          <h3 className={`text-xl font-bold mb-4 ${theme === 'light' ? 'text-slate-900' : 'text-slate-50'}`}>
            Test 3: 탭샷
          </h3>
          <p className={`leading-relaxed ${theme === 'light' ? 'text-slate-500' : 'text-slate-400'}`}>
            20개의 정지 타겟을 1.5초 제한 안에 클릭합니다. 탭샷 정확도와 반응속도를 측정합니다.
          </p>
        </div>
      </div>
    </Layout>
  )
}

export default Home
