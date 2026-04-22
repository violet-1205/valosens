import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'

function ValoButton({ onClick, children, type = 'button', className = '' }) {
  const [hovered, setHovered] = useState(false)
  return (
    <button
      type={type}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`relative inline-flex items-center justify-center ${className}`}
      style={{
        width: '240px',
        height: '54px',
        padding: '8px',
        fontSize: '0.8rem',
        fontWeight: 900,
        color: hovered ? '#ece8e1' : '#ff4655',
        textTransform: 'uppercase',
        textDecoration: 'none',
        boxShadow: '0 0 0 1px inset rgba(236,232,225,0.3)',
        background: 'transparent',
        border: 'none',
        cursor: 'pointer',
        letterSpacing: '0.05em',
        transition: 'color 0.3s ease-out',
      }}
    >
      {/* Left cut */}
      <span style={{ position:'absolute', left:0, top:'50%', transform:'translateY(-50%)', width:1, height:8, background:'#0f1923', zIndex:10 }} />
      {/* Right cut */}
      <span style={{ position:'absolute', right:0, top:'50%', transform:'translateY(-50%)', width:1, height:8, background:'#0f1923', zIndex:10 }} />

      <span style={{ position:'relative', width:'100%', height:'100%', display:'block', overflow:'hidden' }}>
        {/* Corner border (span.base) */}
        <span style={{
          boxSizing:'border-box', position:'absolute', zIndex:2,
          width:'100%', height:'100%', left:0, top:0,
          border: '1px solid #ff4655',
        }}>
          {/* Top-left corner dot */}
          <span style={{ content:'""', width:2, height:2, left:-1, top:-1, background:'#0f1923', position:'absolute', transition:'0.3s ease-out all' }} />
        </span>

        {/* Sliding pink bg (span.bg) */}
        <span style={{
          position:'absolute', left:'-5%', top:0,
          background:'#ff4655',
          width: hovered ? '110%' : '0%',
          height:'100%', zIndex:3,
          transition:'0.3s ease-out all',
          transform:'skewX(-10deg)',
        }} />

        {/* Text layer (span.text) */}
        <span style={{
          zIndex:4, width:'100%', height:'100%',
          position:'absolute', left:0, top:0,
          display:'flex', alignItems:'center', justifyContent:'center',
        }}>
          {children}
          {/* Bottom-right corner dot */}
          <span style={{
            position:'absolute', right:0, bottom:0,
            width:4, height:4,
            background: hovered ? '#ece8e1' : '#0f1923',
            transition:'0.3s ease-out all', zIndex:5,
          }} />
        </span>
      </span>
    </button>
  )
}

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
  // 입력 중 중간 상태("0.0", "0." 등)를 허용하기 위한 별도 문자열 상태
  const [sensInput, setSensInput] = useState(() => {
    const saved = localStorage.getItem('userSetup')
    return saved ? String(JSON.parse(saved).valorantSens) : '0.5'
  })

  const parsedSens = parseFloat(sensInput)
  const validSens = isNaN(parsedSens) ? valorantSens : Math.max(0.01, Math.min(10, parsedSens))

  const eDPI = Math.round(dpi * validSens)
  const cmPer360 = (360 / (validSens * 0.07 * dpi / 2.54)).toFixed(1)

  // 입력 중: 문자열 그대로 허용 (0.0, 0. 같은 중간값 가능)
  const handleSensChange = (val) => {
    setSensInput(val)
    const n = parseFloat(val)
    if (!isNaN(n) && n >= 0.01) setValorantSens(Math.min(10, n))
  }

  // 포커스 아웃 시: 유효 범위로 클램프 후 정규화
  const handleSensBlur = () => {
    const clamped = Math.max(0.01, Math.min(10, isNaN(parsedSens) ? valorantSens : parsedSens))
    setValorantSens(clamped)
    setSensInput(String(clamped))
  }

  // +/- 버튼: 숫자 기준으로 증감
  const stepSens = (delta) => {
    const next = Math.max(0.01, Math.min(10, parseFloat((validSens + delta).toFixed(2))))
    setValorantSens(next)
    setSensInput(String(next))
  }

  const handleDpiInput = (val) => {
    const n = parseInt(val)
    if (!isNaN(n) && n > 0) setDpi(n)
  }

  const dark = theme === 'dark'

  const sensLevel =
    eDPI < 100  ? { label: '초저감도', color: 'text-slate-400' } :
    eDPI < 184  ? { label: '저감도',   color: 'text-blue-400' } :
    eDPI < 268  ? { label: '중저감도', color: 'text-cyan-400' } :
    eDPI < 352  ? { label: '중감도',   color: 'text-green-400' } :
    eDPI < 436  ? { label: '중고감도', color: 'text-yellow-400' } :
    eDPI < 520  ? { label: '고감도',   color: 'text-orange-400' } :
                  { label: '초고감도', color: 'text-[#FF4655]' }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className={`w-full max-w-md rounded-3xl border shadow-2xl p-7 ${
        dark ? 'bg-[#1B2E3D] border-[#2A3D4F] text-[#ECE8E1]' : 'bg-white border-[#DDD8D2] text-[#1A1F2E]'
      }`}>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold">현재 사용 중인 감도를 입력해 주세요</h2>
            <p className={`text-sm mt-0.5 ${dark ? 'text-[#768079]' : 'text-[#7A7E85]'}`}>
              발로란트 인게임 설정 그대로 입력해 주세요
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className={`w-8 h-8 rounded-full flex items-center justify-center text-lg transition-colors ${
              dark ? 'text-[#768079] hover:bg-[#2A3D4F] hover:text-[#ECE8E1]' : 'text-[#7A7E85] hover:bg-[#F5F0EA] hover:text-[#1A1F2E]'
            }`}
          >
            ×
          </button>
        </div>

        {/* DPI */}
        <div className="mb-5">
          <label className={`block text-xs font-semibold uppercase tracking-widest mb-2.5 ${dark ? 'text-[#768079]' : 'text-[#7A7E85]'}`}>
            마우스 DPI
          </label>
          <div className="flex gap-2 mb-2.5">
            {DPI_PRESETS.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setDpi(preset)}
                className={`flex-1 py-2 rounded-xl text-sm font-bold border transition-all ${
                  dpi === preset
                    ? 'bg-[#FF4655] border-[#FF4655] text-white'
                    : dark
                    ? 'border-[#2A3D4F] text-[#768079] hover:border-[#FF4655] hover:text-[#FF4655]'
                    : 'border-[#DDD8D2] text-[#7A7E85] hover:border-[#FF4655] hover:text-[#FF4655]'
                }`}
              >
                {preset}
              </button>
            ))}
          </div>
          <input
            type="number"
            value={dpi}
            onChange={(e) => handleDpiInput(e.target.value)}
            className={`w-full rounded-xl border px-4 py-2.5 text-sm font-bold outline-none focus:border-[#FF4655] transition-colors ${
              dark
                ? 'bg-[#0F1923] border-[#2A3D4F] text-[#ECE8E1] placeholder-[#768079]'
                : 'bg-[#F5F0EA] border-[#DDD8D2] text-[#1A1F2E] placeholder-[#7A7E85]'
            }`}
            placeholder="직접 입력"
            min="100"
            max="32000"
          />
        </div>

        {/* Sensitivity */}
        <div className="mb-6">
          <label className={`block text-xs font-semibold uppercase tracking-widest mb-2.5 ${dark ? 'text-[#768079]' : 'text-[#7A7E85]'}`}>
            인게임 감도
          </label>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => stepSens(-0.01)}
              className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg font-bold border transition-all ${
                dark
                  ? 'border-[#2A3D4F] text-[#768079] hover:border-[#FF4655] hover:text-[#FF4655]'
                  : 'border-[#DDD8D2] text-[#7A7E85] hover:border-[#FF4655] hover:text-[#FF4655]'
              }`}
            >
              −
            </button>
            <input
              type="number"
              value={sensInput}
              onChange={(e) => handleSensChange(e.target.value)}
              onBlur={handleSensBlur}
              className={`flex-1 rounded-xl border px-4 py-2.5 text-center text-xl font-black outline-none focus:border-[#FF4655] transition-colors ${
                dark
                  ? 'bg-[#0F1923] border-[#2A3D4F] text-[#ECE8E1]'
                  : 'bg-[#F5F0EA] border-[#DDD8D2] text-[#1A1F2E]'
              }`}
              step="0.01"
              min="0.01"
              max="10"
            />
            <button
              type="button"
              onClick={() => stepSens(0.01)}
              className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg font-bold border transition-all ${
                dark
                  ? 'border-[#2A3D4F] text-[#768079] hover:border-[#FF4655] hover:text-[#FF4655]'
                  : 'border-[#DDD8D2] text-[#7A7E85] hover:border-[#FF4655] hover:text-[#FF4655]'
              }`}
            >
              +
            </button>
          </div>
        </div>

        {/* Stats Preview */}
        <div className={`rounded-2xl p-4 mb-6 flex justify-around ${
          dark ? 'bg-[#0F1923]' : 'bg-[#F5F0EA]'
        }`}>
          <div className="text-center">
            <p className={`text-xs mb-1 ${dark ? 'text-[#768079]' : 'text-[#7A7E85]'}`}>eDPI</p>
            <p className="text-2xl font-black text-[#FF4655]">{eDPI}</p>
          </div>
          <div className={`w-px ${dark ? 'bg-[#2A3D4F]' : 'bg-[#DDD8D2]'}`} />
          <div className="text-center">
            <p className={`text-xs mb-1 ${dark ? 'text-[#768079]' : 'text-[#7A7E85]'}`}>cm/360°</p>
            <p className={`text-2xl font-black ${dark ? 'text-[#ECE8E1]' : 'text-[#1A1F2E]'}`}>{cmPer360}</p>
          </div>
          <div className={`w-px ${dark ? 'bg-[#2A3D4F]' : 'bg-[#DDD8D2]'}`} />
          <div className="text-center">
            <p className={`text-xs mb-1 ${dark ? 'text-[#768079]' : 'text-[#7A7E85]'}`}>수준</p>
            <p className={`text-base font-bold ${sensLevel.color}`}>{sensLevel.label}</p>
          </div>
        </div>

        {/* Confirm */}
        <div className="flex justify-center mt-2">
          <ValoButton onClick={() => onConfirm({ dpi, valorantSens: validSens, eDPI })}>
            테스트 시작하기
          </ValoButton>
        </div>
      </div>
    </div>
  )
}

const tests = [
  {
    num: '01',
    title: '360° 회전 정밀도',
    desc: '아무 곳이나 클릭 후 오른쪽으로 360° 회전하고 같은 지점으로 돌아옵니다. 각도 편차로 회전 정밀도를 측정합니다.',
    tag: '회전 제어',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8">
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 11a8 8 0 0 1 12.5-6.5" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 4.5H21v4.5" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M20 13a8 8 0 0 1-12.5 6.5" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 19.5H3V15" />
      </svg>
    ),
  },
  {
    num: '02',
    title: '코너 플릭킹',
    desc: '좌우로 튀어나오는 적을 빠르게 플릭합니다. 오버슈트/언더슈트 경향을 분석합니다.',
    tag: '플릭 에임',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8">
        <circle cx="12" cy="12" r="5" />
        <circle cx="12" cy="12" r="2" />
        <path strokeLinecap="round" d="M12 4v3M12 17v3M4 12h3M17 12h3" />
      </svg>
    ),
  },
  {
    num: '03',
    title: '정지 타겟 탭샷',
    desc: '1.5초 제한으로 20개 타겟을 클릭합니다. 탭샷 정확도와 반응속도를 동시에 측정합니다.',
    tag: '탭샷 속도',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8">
        <circle cx="12" cy="12" r="3" />
        <path strokeLinecap="round" d="M12 2v4M12 18v4M2 12h4M18 12h4" />
        <path strokeLinecap="round" d="M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M5.6 18.4l2.8-2.8M15.6 8.4l2.8-2.8" />
      </svg>
    ),
  },
]

function Home() {
  const navigate = useNavigate()
  const [showSetup, setShowSetup] = useState(false)
  const [themeMode, setThemeMode] = useState(() => {
    return localStorage.getItem('themeMode') || 'system'
  })

  const resolveTheme = (mode) => {
    if (mode === 'system') {
      return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    }
    return mode
  }

  const theme = resolveTheme(themeMode)
  const dark = theme === 'dark'

  useEffect(() => {
    const handleThemeChange = (e) => setThemeMode(e.detail)
    window.addEventListener('theme-change', handleThemeChange)
    return () => window.removeEventListener('theme-change', handleThemeChange)
  }, [])

  const handleConfirm = ({ dpi, valorantSens, eDPI }) => {
    localStorage.setItem('userSetup', JSON.stringify({ dpi, valorantSens, eDPI }))
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

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-5 pt-20 pb-16 text-center">
        <div className="max-w-2xl mx-auto animate-fade-up">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full mb-6 border text-xs font-semibold tracking-wide"
            style={dark
              ? { background: 'rgba(255,70,85,0.1)', borderColor: 'rgba(255,70,85,0.3)', color: '#FF4655' }
              : { background: 'rgba(255,70,85,0.08)', borderColor: 'rgba(255,70,85,0.25)', color: '#BD3944' }
            }
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#FF4655] animate-pulse" />
            발로란트 감도 측정 도구
          </div>

          {/* Title */}
          <h1 className={`text-4xl md:text-5xl font-black leading-[1.15] mb-5 tracking-tight ${dark ? 'text-[#ECE8E1]' : 'text-[#1A1F2E]'}`}>
            지금 감도가<br />
            <span className="text-[#FF4655]">진짜 맞는지</span><br />
            확인해 보세요
          </h1>

          <p className={`text-base md:text-lg leading-relaxed mb-8 max-w-lg mx-auto ${dark ? 'text-[#768079]' : 'text-[#7A7E85]'}`}>
            회전 정밀도, 플릭, 탭샷 — 3가지 테스트로
            지금 감도가 내 플레이 스타일에 맞는지 숫자로 확인해 보세요.
          </p>

          {/* CTA */}
          <div className="flex flex-col items-center gap-3">
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <ValoButton onClick={() => setShowSetup(true)}>
                테스트 시작하기
              </ValoButton>
            </div>
            <span className={`text-sm ${dark ? 'text-[#768079]' : 'text-[#7A7E85]'}`}>
              무료 · 3분 소요
            </span>
          </div>
        </div>
      </section>

      {/* Divider */}
      <div className={`max-w-6xl mx-auto px-5`}>
        <div className={`h-px ${dark ? 'bg-[#2A3D4F]' : 'bg-[#DDD8D2]'}`} />
      </div>

      {/* Tests */}
      <section className="max-w-6xl mx-auto px-5 py-16">
        <div className="mb-10 text-center">
          <p className={`text-xs font-semibold uppercase tracking-widest mb-2 ${dark ? 'text-[#768079]' : 'text-[#7A7E85]'}`}>
            테스트 구성
          </p>
          <h2 className={`text-2xl font-bold ${dark ? 'text-[#ECE8E1]' : 'text-[#1A1F2E]'}`}>
            총 3단계로 측정합니다
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {tests.map((t, i) => (
            <div
              key={t.num}
              className={`rounded-3xl border p-6 transition-all duration-300 hover:-translate-y-1 ${
                dark
                  ? 'bg-[#1B2E3D] border-[#2A3D4F] hover:border-[#FF4655]/30 hover:shadow-xl hover:shadow-[#FF4655]/5'
                  : 'bg-white border-[#DDD8D2] hover:border-[#FF4655]/30 hover:shadow-xl hover:shadow-black/5'
              }`}
              style={{ animationDelay: `${i * 0.1}s` }}
            >
              {/* Number + Icon */}
              <div className="flex items-start justify-between mb-5">
                <span className="text-4xl font-black text-[#FF4655]/20 leading-none select-none">{t.num}</span>
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
                  dark ? 'bg-[#FF4655]/10 text-[#FF4655]' : 'bg-[#FF4655]/8 text-[#FF4655]'
                }`}>
                  {t.icon}
                </div>
              </div>

              <h3 className={`text-base font-bold mb-2 ${dark ? 'text-[#ECE8E1]' : 'text-[#1A1F2E]'}`}>
                {t.title}
              </h3>
              <p className={`text-sm leading-relaxed mb-4 ${dark ? 'text-[#768079]' : 'text-[#7A7E85]'}`}>
                {t.desc}
              </p>

              <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold ${
                dark
                  ? 'bg-[#2A3D4F] text-[#768079]'
                  : 'bg-[#F5F0EA] text-[#7A7E85]'
              }`}>
                {t.tag}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Bottom CTA */}
      <section className={`mx-5 mb-16 rounded-3xl p-10 text-center ${
        dark ? 'bg-[#1B2E3D]' : 'bg-white border border-[#DDD8D2]'
      }`}>
        <h2 className={`text-xl font-bold mb-2 ${dark ? 'text-[#ECE8E1]' : 'text-[#1A1F2E]'}`}>
          지금 바로 시작해 보세요
        </h2>
        <p className={`text-sm mb-6 ${dark ? 'text-[#768079]' : 'text-[#7A7E85]'}`}>
          DPI와 인게임 감도만 있으면 바로 시작하실 수 있습니다
        </p>
        <ValoButton onClick={() => setShowSetup(true)}>
          감도 테스트 시작
        </ValoButton>
      </section>
    </Layout>
  )
}

export default Home
