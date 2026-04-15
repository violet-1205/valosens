import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'

function Result() {
  const navigate = useNavigate()
  const [allData, setAllData] = useState({ test1: null, test2: null, test3: null })
  const [recommendedSens, setRecommendedSens] = useState(null)

  const [themeMode, setThemeMode] = useState(() => {
    return localStorage.getItem('themeMode') || 'system'
  })

  const resolveTheme = (mode) => {
    if (mode === 'system') {
      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) return 'dark'
      return 'light'
    }
    return mode
  }

  const theme = resolveTheme(themeMode)

  // 사용자 설정 읽기
  const userSetup = JSON.parse(
    localStorage.getItem('userSetup') || '{"dpi":800,"valorantSens":0.5,"eDPI":400}'
  )

  useEffect(() => {
    const test1Data = localStorage.getItem('test1Data')
    const test2Data = localStorage.getItem('test2Data')
    const test3Data = localStorage.getItem('test3Data')

    if (test1Data && test2Data && test3Data) {
      const data = {
        test1: JSON.parse(test1Data),
        test2: JSON.parse(test2Data),
        test3: JSON.parse(test3Data),
      }
      setAllData(data)
      calculateSensitivity(data)
    }
  }, [])

  useEffect(() => {
    const handleThemeChange = (e) => setThemeMode(e.detail)
    window.addEventListener('theme-change', handleThemeChange)
    return () => window.removeEventListener('theme-change', handleThemeChange)
  }, [])

  const calculateSensitivity = (data) => {
    const currentValorantSens = userSetup.valorantSens || 0.5
    const userDPI = userSetup.dpi || 800

    const deviationDeg = data.test1?.deviationDeg || 0
    const flickAccuracy = data.test2?.accuracy || 50
    const flickRecommendation = data.test2?.recommendation
    const tappingAccuracy = data.test3?.tappingAccuracy || 50
    const avgReactionTime = data.test3?.avgReactionTime || 600

    // 현재 감도를 기준으로 상대 조정
    let adjustedSens = currentValorantSens

    // 1. 360° 각도 편차 분석
    if (deviationDeg > 30) {
      adjustedSens *= 0.92  // 제어 불안정 → 감도 낮춤
    }

    // 2. 코너 플릭킹 오버슈트/언더슈트 편향
    if (flickRecommendation === '감도 낮춤 추천') {
      adjustedSens *= 0.90
    } else if (flickRecommendation === '감도 높임 추천') {
      adjustedSens *= 1.10
    }

    // 2.5. 플릭킹 정확도
    if (flickAccuracy > 80) {
      adjustedSens *= 1.02  // 높은 정확도 → 약간 유지/상향 가능
    } else if (flickAccuracy < 50) {
      adjustedSens *= 0.95  // 낮은 정확도 → 안정성 위해 낮춤
    }

    // 3. 탭샷 정밀도 + 반응속도 (발로란트 핵심)
    if (tappingAccuracy > 75 && avgReactionTime < 500) {
      adjustedSens *= 1.03  // 빠르고 정확 → 현재 감도에서 제어력 충분
    } else if (tappingAccuracy < 50) {
      adjustedSens *= 0.95  // 낮은 탭샷 정확도 → 감도 낮춰 정밀도 확보
    }

    const recommendedValorantSens = Math.max(0.1, Math.min(10, adjustedSens))
    const recommendedEDPI = Math.round(recommendedValorantSens * userDPI)
    const delta = recommendedValorantSens - currentValorantSens

    setRecommendedSens({
      valorantSens: recommendedValorantSens.toFixed(2),
      dpi: userDPI,
      eDPI: recommendedEDPI,
      currentSens: currentValorantSens,
      currentEDPI: userSetup.eDPI,
      delta: delta.toFixed(2),
    })
  }

  const test2Score = allData.test2?.score ?? 0
  const test2Misses = allData.test2?.misses ?? 0
  const test2DiffRaw = test2Score - test2Misses
  const test2Diff = Math.max(0, Math.min(100, test2DiffRaw))
  let test2Level = '하'
  if (test2Diff >= 60) test2Level = '상'
  else if (test2Diff >= 30) test2Level = '중'

  const handleRestart = () => {
    localStorage.removeItem('test1Data')
    localStorage.removeItem('test2Data')
    localStorage.removeItem('test3Data')
    localStorage.removeItem('userSetup')
    localStorage.removeItem('userSensitivity')
    navigate('/')
  }

  return (
    <Layout isTestPage={true}>
      <div className="w-full flex flex-col items-center justify-center min-h-[calc(100vh-64px-48px)] py-10">
        <div className="w-full max-w-4xl mx-auto px-6">

          {/* 헤더 */}
          <div className="text-center mb-12">
            <h1 className={`text-4xl md:text-5xl font-extrabold mb-3 tracking-tight ${
              theme === 'light' ? 'text-slate-900' : 'text-slate-50'
            }`}>
              결과 리포트
            </h1>
            <p className={`text-sm md:text-base ${theme === 'light' ? 'text-slate-600' : 'text-slate-300'}`}>
              세 가지 테스트 데이터를 종합해서 현재 감도와 플레이 스타일의 궁합을 정리했습니다.
            </p>
          </div>

          {/* 현재 설정 배너 */}
          <div className={`flex items-center justify-center gap-8 mb-10 px-6 py-4 border ${
            theme === 'light' ? 'bg-slate-50 border-slate-200' : 'bg-slate-800/60 border-slate-700'
          }`}>
            <span className={`text-xs font-bold uppercase tracking-widest ${
              theme === 'light' ? 'text-slate-500' : 'text-slate-400'
            }`}>테스트 감도</span>
            <div className="flex gap-6 items-center">
              <div className="text-center">
                <p className={`text-xs ${theme === 'light' ? 'text-slate-400' : 'text-slate-500'}`}>DPI</p>
                <p className={`text-lg font-black ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>
                  {userSetup.dpi}
                </p>
              </div>
              <div className="text-center">
                <p className={`text-xs ${theme === 'light' ? 'text-slate-400' : 'text-slate-500'}`}>발로란트 감도</p>
                <p className={`text-lg font-black ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>
                  {userSetup.valorantSens}
                </p>
              </div>
              <div className="text-center">
                <p className={`text-xs ${theme === 'light' ? 'text-slate-400' : 'text-slate-500'}`}>eDPI</p>
                <p className="text-lg font-black text-[#ff4655]">{userSetup.eDPI}</p>
              </div>
            </div>
          </div>

          {/* 테스트 결과 3개 카드 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-10">

            {/* Test 1 */}
            <div className={`shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 px-5 py-6 border ${
              theme === 'light' ? 'bg-white border-slate-100' : 'bg-slate-900 border-slate-800'
            }`}>
              <h3 className="text-[11px] font-semibold text-slate-500 uppercase tracking-[0.16em] mb-2">
                Test 1 · Rotation
              </h3>
              <p className={`text-3xl font-black ${theme === 'light' ? 'text-slate-900' : 'text-slate-50'}`}>
                {allData.test1?.avgMovement?.toFixed(0) || 0}
                <span className="text-xs font-normal text-slate-500 ml-1">px</span>
              </p>
              <p className="text-[11px] text-slate-500 mt-2">360° 회전 시 마우스 이동량</p>
              {allData.test1?.deviationDeg !== undefined && (
                <p className={`text-[11px] mt-1 font-medium ${
                  allData.test1.deviationDeg <= 10 ? 'text-green-500' :
                  allData.test1.deviationDeg <= 25 ? 'text-yellow-500' : 'text-red-500'
                }`}>
                  각도 편차 {allData.test1.deviationDeg}°
                </p>
              )}
            </div>

            {/* Test 2 */}
            <div className={`shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 px-5 py-6 border ${
              theme === 'light' ? 'bg-white border-slate-100' : 'bg-slate-900 border-slate-800'
            }`}>
              <h3 className="text-[11px] font-semibold text-slate-500 uppercase tracking-[0.16em] mb-2">
                Test 2 · Flicking
              </h3>
              <p className={`text-3xl font-black ${theme === 'light' ? 'text-slate-900' : 'text-slate-50'}`}>
                {test2Level}
              </p>
              <p className="text-[11px] text-slate-500 mt-2">
                Hit {test2Score} · Miss {test2Misses} · 순점수 {test2Diff}
              </p>
              {allData.test2?.recommendation && (
                <p className={`text-[11px] font-bold mt-2 ${
                  allData.test2.recommendation.includes('낮춤') ? 'text-blue-500' :
                  allData.test2.recommendation.includes('높임') ? 'text-red-500' : 'text-green-500'
                }`}>
                  {allData.test2.recommendation}
                </p>
              )}
            </div>

            {/* Test 3 */}
            <div className={`shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 px-5 py-6 border ${
              theme === 'light' ? 'bg-white border-slate-100' : 'bg-slate-900 border-slate-800'
            }`}>
              <h3 className="text-[11px] font-semibold text-slate-500 uppercase tracking-[0.16em] mb-2">
                Test 3 · Tapping
              </h3>
              <p className={`text-3xl font-black ${theme === 'light' ? 'text-slate-900' : 'text-slate-50'}`}>
                {allData.test3?.tappingAccuracy || 0}
                <span className="text-xs font-normal text-slate-500 ml-1">%</span>
              </p>
              <p className="text-[11px] text-slate-500 mt-2">
                정지 타겟 탭샷 정확도 ({allData.test3?.hits || 0} / {allData.test3?.total || 20})
              </p>
              {allData.test3?.avgReactionTime > 0 && (
                <p className={`text-[11px] mt-1 font-medium ${
                  allData.test3.avgReactionTime < 400 ? 'text-green-500' :
                  allData.test3.avgReactionTime < 700 ? 'text-yellow-500' : 'text-red-500'
                }`}>
                  평균 반응속도 {allData.test3.avgReactionTime}ms
                </p>
              )}
            </div>
          </div>

          {/* 플릭킹 분석 디테일 */}
          {allData.test2?.detail && (
            <div className={`mb-10 p-5 border text-sm ${
              theme === 'light'
                ? 'bg-slate-50 border-slate-200 text-slate-700'
                : 'bg-slate-800/50 border-slate-700 text-slate-300'
            }`}>
              <span className="font-bold mr-2">플릭킹 정밀 분석:</span>
              {allData.test2.detail}
            </div>
          )}

          {/* 감도 추천 */}
          {recommendedSens && (
            <div className={`border shadow-md px-8 py-10 ${
              theme === 'light' ? 'bg-white border-slate-100' : 'bg-slate-900 border-slate-800'
            }`}>
              <h2 className={`text-xl md:text-2xl font-semibold mb-8 text-center ${
                theme === 'light' ? 'text-slate-900' : 'text-slate-50'
              }`}>
                감도 추천
              </h2>

              {/* 현재 vs 추천 비교 */}
              <div className="grid grid-cols-2 gap-4 mb-8">

                {/* 현재 감도 */}
                <div className={`px-6 py-5 border ${
                  theme === 'light' ? 'bg-slate-50 border-slate-200' : 'bg-slate-800 border-slate-700'
                }`}>
                  <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-[0.16em] mb-4">
                    현재 감도
                  </p>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className={`text-xs ${theme === 'light' ? 'text-slate-500' : 'text-slate-400'}`}>DPI</span>
                      <span className={`font-bold ${theme === 'light' ? 'text-slate-700' : 'text-slate-200'}`}>
                        {recommendedSens.dpi}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className={`text-xs ${theme === 'light' ? 'text-slate-500' : 'text-slate-400'}`}>감도</span>
                      <span className={`font-bold text-lg ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>
                        {recommendedSens.currentSens}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className={`text-xs ${theme === 'light' ? 'text-slate-500' : 'text-slate-400'}`}>eDPI</span>
                      <span className="font-bold text-lg text-slate-500">{recommendedSens.currentEDPI}</span>
                    </div>
                  </div>
                </div>

                {/* 추천 감도 */}
                <div className={`px-6 py-5 border-2 border-[#ff4655] relative ${
                  theme === 'light' ? 'bg-white' : 'bg-slate-800/50'
                }`}>
                  <p className="text-[11px] font-semibold text-[#ff4655] uppercase tracking-[0.16em] mb-4">
                    추천 감도
                  </p>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className={`text-xs ${theme === 'light' ? 'text-slate-500' : 'text-slate-400'}`}>DPI</span>
                      <span className={`font-bold ${theme === 'light' ? 'text-slate-700' : 'text-slate-200'}`}>
                        {recommendedSens.dpi}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className={`text-xs ${theme === 'light' ? 'text-slate-500' : 'text-slate-400'}`}>감도</span>
                      <span className="font-black text-2xl text-[#ff4655]">
                        {recommendedSens.valorantSens}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className={`text-xs ${theme === 'light' ? 'text-slate-500' : 'text-slate-400'}`}>eDPI</span>
                      <span className="font-bold text-lg text-[#ff4655]">{recommendedSens.eDPI}</span>
                    </div>
                  </div>

                  {/* 변화량 뱃지 */}
                  {parseFloat(recommendedSens.delta) !== 0 && (
                    <div className={`absolute -top-3 -right-3 px-2 py-0.5 text-xs font-black ${
                      parseFloat(recommendedSens.delta) < 0
                        ? 'bg-blue-500 text-white'
                        : 'bg-red-500 text-white'
                    }`}>
                      {parseFloat(recommendedSens.delta) > 0 ? '+' : ''}{recommendedSens.delta}
                    </div>
                  )}
                </div>
              </div>

              {/* 변화 설명 */}
              <div className={`mb-8 px-4 py-3 text-sm text-center ${
                parseFloat(recommendedSens.delta) === 0
                  ? theme === 'light' ? 'bg-green-50 text-green-700' : 'bg-green-900/20 text-green-400'
                  : parseFloat(recommendedSens.delta) < 0
                  ? theme === 'light' ? 'bg-blue-50 text-blue-700' : 'bg-blue-900/20 text-blue-400'
                  : theme === 'light' ? 'bg-red-50 text-red-700' : 'bg-red-900/20 text-red-400'
              }`}>
                {parseFloat(recommendedSens.delta) === 0
                  ? '현재 감도가 테스트 결과와 잘 맞습니다.'
                  : parseFloat(recommendedSens.delta) < 0
                  ? `감도를 ${Math.abs(parseFloat(recommendedSens.delta)).toFixed(2)} 낮추세요. 오버슈트 또는 제어 불안정 경향이 있습니다.`
                  : `감도를 ${parseFloat(recommendedSens.delta).toFixed(2)} 높이세요. 언더슈트 또는 반응 여유가 있습니다.`
                }
              </div>

              <p className="text-[11px] text-slate-500 text-center mb-6">
                현재 테스트 데이터 기준 추정값입니다. 실제 게임에서 몇 판 플레이하며 미세 조정해 보세요.
              </p>

              <div className={`pt-6 border-t flex items-center justify-center ${
                theme === 'light' ? 'border-slate-100' : 'border-slate-800'
              }`}>
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
