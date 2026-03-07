import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'

function Result() {
  const navigate = useNavigate()
  const [allData, setAllData] = useState({
    test1: null,
    test2: null,
    test3: null
  })
  const [recommendedSens, setRecommendedSens] = useState(null)

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
    const test1Data = localStorage.getItem('test1Data')
    const test2Data = localStorage.getItem('test2Data')
    const test3Data = localStorage.getItem('test3Data')

    if (test1Data && test2Data && test3Data) {
      const data = {
        test1: JSON.parse(test1Data),
        test2: JSON.parse(test2Data),
        test3: JSON.parse(test3Data)
      }
      setAllData(data)
      calculateSensitivity(data)
    }
  }, [])

  useEffect(() => {
    const handleThemeChange = (e) => {
      setThemeMode(e.detail)
    }
    window.addEventListener('theme-change', handleThemeChange)
    return () => {
      window.removeEventListener('theme-change', handleThemeChange)
    }
  }, [])

  const calculateSensitivity = (data) => {
    const movement = data.test1?.avgMovement || 500
    const flickAccuracy = data.test2?.accuracy || 50
    const timeSpent = data.test2?.timeSpent || 30
    const trackAccuracy = data.test3?.trackingAccuracy || 50
    const flickRecommendation = data.test2?.recommendation

    // 기본 감도 설정
    let baseSens = 0.4
    
    // 1. 회전 이동량 분석 (팔 vs 손목 에임 경향)
    if (movement > 1000) baseSens -= 0.1 // 큰 동작 위주 -> 저감도 추천
    if (movement < 500) baseSens += 0.1  // 작은 동작 위주 -> 고감도 추천

    // 2. 플릭킹 정확도 및 속도 분석
    // 시간이 짧고 정확도가 높을수록 고감도 제어력이 좋음
    if (flickAccuracy > 80 && timeSpent < 15) baseSens += 0.05
    else if (flickAccuracy < 50) baseSens -= 0.05 // 정확도가 낮으면 감도를 낮춰 안정성 확보

    // 2.5 Flicking Bias Analysis (Overshoot/Undershoot)
    if (flickRecommendation === '감도 낮춤 추천') {
        baseSens -= 0.05
    } else if (flickRecommendation === '감도 높임 추천') {
        baseSens += 0.05
    }

    // 3. 트래킹 정확도 분석
    if (trackAccuracy > 70) baseSens *= 1.05 // 트래킹이 좋으면 현재 성향 유지/약간 상향
    else if (trackAccuracy < 40) baseSens *= 0.9 // 트래킹이 불안정하면 감도를 낮춤

    setRecommendedSens({
      sensitivity: Math.max(0.1, Math.min(2.0, baseSens)).toFixed(3),
      dpi: 800,
      eDPI: (baseSens * 800).toFixed(0)
    })
  }

  const test2Score = allData.test2?.score ?? 0
  const test2Misses = allData.test2?.misses ?? 0
  const test2DiffRaw = test2Score - test2Misses
  const test2Diff = Math.max(0, Math.min(100, test2DiffRaw))
  let test2Level = '하'
  if (test2Diff >= 60) {
    test2Level = '상'
  } else if (test2Diff >= 30) {
    test2Level = '중'
  }

  const handleRestart = () => {
    localStorage.removeItem('test1Data')
    localStorage.removeItem('test2Data')
    localStorage.removeItem('test3Data')
    localStorage.removeItem('userSensitivity')
    navigate('/')
  }

  return (
    <Layout isTestPage={true}>
      <div className="w-full flex flex-col items-center justify-center min-h-[calc(100vh-64px-48px)] py-10">
        <div className="w-full max-w-4xl mx-auto px-6">
          <div className="text-center mb-12">
            <h1
              className={`text-4xl md:text-5xl font-extrabold mb-3 tracking-tight ${
                theme === 'light' ? 'text-slate-900' : 'text-slate-50'
              }`}
            >
              결과 리포트
            </h1>
            <p
              className={`text-sm md:text-base ${
                theme === 'light' ? 'text-slate-900' : 'text-slate-300'
              }`}
            >
              세 가지 테스트 데이터를 종합해서 현재 감도와 플레이 스타일의 궁합을 정리했습니다.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-10">
            <div
              className={`shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 px-5 py-6 border ${
                theme === 'light' ? 'bg-white border-slate-100' : 'bg-slate-900 border-slate-800'
              }`}
            >
              <h3 className="text-[11px] font-semibold text-slate-500 uppercase tracking-[0.16em] mb-2">
                Test 1 · Rotation
              </h3>
              <p
                className={`text-3xl font-black ${
                  theme === 'light' ? 'text-slate-900' : 'text-slate-50'
                }`}
              >
                {allData.test1?.avgMovement.toFixed(0) || 0}
                <span className="text-xs font-normal text-slate-500 ml-1">px</span>
              </p>
              <p className="text-[11px] text-slate-500 mt-2">360° 회전 시 평균 마우스 이동량</p>
            </div>

            <div
              className={`shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 px-5 py-6 border ${
                theme === 'light' ? 'bg-white border-slate-100' : 'bg-slate-900 border-slate-800'
              }`}
            >
              <h3 className="text-[11px] font-semibold text-slate-500 uppercase tracking-[0.16em] mb-2">
                Test 2 · Flicking
              </h3>
              <p
                className={`text-3xl font-black ${
                  theme === 'light' ? 'text-slate-900' : 'text-slate-50'
                }`}
              >
                {test2Level}
              </p>
              <p className="text-[11px] text-slate-500 mt-2">
                Hit {test2Score} · Miss {test2Misses} · 순점수 {test2Diff}개
              </p>
              {allData.test2?.recommendation && (
                <p className={`text-[11px] font-bold mt-2 ${allData.test2.recommendation.includes('낮춤') ? 'text-blue-500' : allData.test2.recommendation.includes('높임') ? 'text-red-500' : 'text-green-500'}`}>
                    {allData.test2.recommendation}
                </p>
              )}
            </div>

            <div
              className={`shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 px-5 py-6 border ${
                theme === 'light' ? 'bg-white border-slate-100' : 'bg-slate-900 border-slate-800'
              }`}
            >
              <h3 className="text-[11px] font-semibold text-slate-500 uppercase tracking-[0.16em] mb-2">
                Test 3 · Tracking
              </h3>
              <p
                className={`text-3xl font-black ${
                  theme === 'light' ? 'text-slate-900' : 'text-slate-50'
                }`}
              >
                {allData.test3?.trackingAccuracy || 0}
                <span className="text-xs font-normal text-slate-500 ml-1">%</span>
              </p>
              <p className="text-[11px] text-slate-500 mt-2">움직이는 타겟에 대한 조준 유지력</p>
            </div>
          </div>

          {allData.test2?.detail && (
            <div className={`mb-10 p-5 rounded-lg border text-sm ${
                theme === 'light' ? 'bg-slate-50 border-slate-200 text-slate-700' : 'bg-slate-800/50 border-slate-700 text-slate-300'
            }`}>
              <span className="font-bold mr-2">🎯 플릭킹 정밀 분석:</span>
              {allData.test2.detail}
            </div>
          )}

          {recommendedSens && (
            <div
              className={`border shadow-md px-8 py-10 text-center ${
                theme === 'light' ? 'bg-white border-slate-100' : 'bg-slate-900 border-slate-800'
              }`}
            >
              <h2
                className={`text-xl md:text-2xl font-semibold mb-6 ${
                  theme === 'light' ? 'text-slate-900' : 'text-slate-50'
                }`}
              >
                이 감도부터 시작해 보세요
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center mb-6">
                <div className="space-y-1">
                  <p className="text-slate-500 text-xs font-medium uppercase tracking-[0.16em]">
                    In-game Sensitivity
                  </p>
                  <p
                    className={`text-4xl md:text-5xl font-black ${
                      theme === 'light' ? 'text-slate-900' : 'text-slate-50'
                    }`}
                  >
                    {recommendedSens.sensitivity}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-slate-500 text-xs font-medium uppercase tracking-[0.16em]">
                    DPI
                  </p>
                  <p
                    className={`text-4xl md:text-5xl font-black ${
                      theme === 'light' ? 'text-slate-900' : 'text-slate-50'
                    }`}
                  >
                    {recommendedSens.dpi}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-slate-500 text-xs font-medium uppercase tracking-[0.16em]">
                    eDPI
                  </p>
                  <p
                    className={`text-4xl md:text-5xl font-black ${
                      theme === 'light' ? 'text-slate-900' : 'text-slate-50'
                    }`}
                  >
                    {recommendedSens.eDPI}
                  </p>
                </div>
              </div>

              <p className="text-[11px] text-slate-500 mb-6">
                현재 테스트 데이터 기준으로 추정한 값입니다. 실제 게임에서 몇 판 정도 플레이하면서 미세 조정해 보세요.
              </p>

              <div
                className={`pt-6 border-t flex items-center justify-center ${
                  theme === 'light' ? 'border-slate-100' : 'border-slate-800'
                }`}
              >
                <button 
                  onClick={handleRestart}
                  className="px-7 py-2.5 bg-slate-900 text-white font-semibold text-sm hover:bg-slate-800 transition-all"
                >
                  처음부터 다시 테스트하기
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}

export default Result
