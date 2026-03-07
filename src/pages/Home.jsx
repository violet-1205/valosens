import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'

function Home() {
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

  useEffect(() => {
    const handleThemeChange = (e) => {
      setThemeMode(e.detail)
    }
    window.addEventListener('theme-change', handleThemeChange)
    return () => {
      window.removeEventListener('theme-change', handleThemeChange)
    }
  }, [])

  return (
    <Layout>
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
          3D 시뮬레이션으로 회전, 플릭, 트래킹을 각각 측정해서<br />
          지금 감도와 플레이 스타일이 얼마나 맞는지 숫자로 확인해 보세요.
        </p>
        
        <button 
          onClick={() => navigate('/test1')}
          className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-normal shadow-lg hover:shadow-slate-700/40 transition-all duration-300 transform hover:-translate-y-0.5 text-lg"
        >
          감도 측정 시뮬레이션 시작
        </button>
      </div>

      {/* Features Grid - Tests 1, 2, 3 */}
      <div className="max-w-7xl mx-auto px-6 py-24 grid grid-cols-1 md:grid-cols-3 gap-12">
        <div
          className={`p-8 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 border ${
            theme === 'light' ? 'bg-white border-slate-100' : 'bg-slate-900 border-slate-800'
          }`}
        >
          <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center mb-6">
            <svg
              className="w-6 h-6 text-blue-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 11a8 8 0 0 1 12.5-6.5"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M16.5 4.5H21v4.5"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M20 13a8 8 0 0 1-12.5 6.5"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M7.5 19.5H3V15"
              />
            </svg>
          </div>
          <h3
            className={`text-xl font-bold mb-4 ${
              theme === 'light' ? 'text-slate-900' : 'text-slate-50'
            }`}
          >
            Test 1: 마우스 이동량 확인
          </h3>
          <p
            className={`leading-relaxed ${
              theme === 'light' ? 'text-slate-500' : 'text-slate-400'
            }`}
          >
            180° 회전할 때 마우스 이동량과 패드 시작·끝 위치를 함께 기록합니다.
          </p>
        </div>

        <div
          className={`p-8 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 border ${
            theme === 'light' ? 'bg-white border-slate-100' : 'bg-slate-900 border-slate-800'
          }`}
        >
          <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center mb-6">
            <svg
              className="w-6 h-6 text-indigo-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <circle
                cx="12"
                cy="12"
                r="6"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle
                cx="12"
                cy="12"
                r="3"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 3v3"
              />
              <path
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 18v3"
              />
              <path
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 12h3"
              />
              <path
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M18 12h3"
              />
            </svg>
          </div>
          <h3
            className={`text-xl font-bold mb-4 ${
              theme === 'light' ? 'text-slate-900' : 'text-slate-50'
            }`}
          >
            Test 2: 정적 Flicking
          </h3>
          <p
            className={`leading-relaxed ${
              theme === 'light' ? 'text-slate-500' : 'text-slate-400'
            }`}
          >
            랜덤 위치의 붉은 타겟을 클릭해 히트/미스 비율로 플릭 감도를 확인합니다.
          </p>
        </div>

        <div
          className={`p-8 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 border ${
            theme === 'light' ? 'bg-white border-slate-100' : 'bg-slate-900 border-slate-800'
          }`}
        >
          <div className="w-12 h-12 bg-violet-50 rounded-2xl flex items-center justify-center mb-6">
            <svg
              className="w-6 h-6 text-violet-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4 18c2.5-3 4.5-4 6.5-4s4 1 6.5-2"
              />
              <circle
                cx="5"
                cy="18"
                r="2"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle
                cx="19"
                cy="7"
                r="2"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 10.5l1.5 1.5"
              />
            </svg>
          </div>
          <h3
            className={`text-xl font-bold mb-4 ${
              theme === 'light' ? 'text-slate-900' : 'text-slate-50'
            }`}
          >
            Test 3: 트래킹
          </h3>
          <p
            className={`leading-relaxed ${
              theme === 'light' ? 'text-slate-500' : 'text-slate-400'
            }`}
          >
            움직이는 타겟을 따라가며 트래킹 유지력과 트래킹형 플레이 감도를 확인합니다.
          </p>
        </div>
      </div>
    </Layout>
  )
}

export default Home
