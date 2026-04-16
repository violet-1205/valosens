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
  const dark = theme === 'dark'

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

    let adjustedSens = currentValorantSens

    if (deviationDeg > 30) adjustedSens *= 0.92
    if (flickRecommendation === '감도 낮춤 추천') adjustedSens *= 0.90
    else if (flickRecommendation === '감도 높임 추천') adjustedSens *= 1.10
    if (flickAccuracy > 80) adjustedSens *= 1.02
    else if (flickAccuracy < 50) adjustedSens *= 0.95
    if (tappingAccuracy > 75 && avgReactionTime < 500) adjustedSens *= 1.03
    else if (tappingAccuracy < 50) adjustedSens *= 0.95

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

  const card = dark
    ? 'bg-[#1B2E3D] border-[#2A3D4F]'
    : 'bg-white border-[#DDD8D2]'
  const muted = dark ? 'text-[#768079]' : 'text-[#7A7E85]'
  const text = dark ? 'text-[#ECE8E1]' : 'text-[#1A1F2E]'

  return (
    <Layout isTestPage={true}>
      <div className={`w-full min-h-[calc(100vh-56px-48px)] py-12 px-4 ${dark ? 'bg-[#0F1923]' : 'bg-[#F5F0EA]'}`}>
        <div className="w-full max-w-3xl mx-auto">

          {/* 헤더 */}
          <div className="text-center mb-10">
            <div className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full mb-4 border text-xs font-semibold`}
              style={dark
                ? { background: 'rgba(255,70,85,0.1)', borderColor: 'rgba(255,70,85,0.3)', color: '#FF4655' }
                : { background: 'rgba(255,70,85,0.08)', borderColor: 'rgba(255,70,85,0.25)', color: '#BD3944' }
              }
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#FF4655]" />
              테스트 완료
            </div>
            <h1 className={`text-3xl md:text-4xl font-black mb-2 ${text}`}>
              결과 리포트
            </h1>
            <p className={`text-sm ${muted}`}>
              세 가지 테스트 데이터를 종합해서 현재 감도와 플레이 스타일의 궁합을 정리했습니다.
            </p>
          </div>

          {/* 현재 감도 배너 */}
          <div className={`rounded-2xl border px-6 py-4 mb-6 flex items-center justify-between flex-wrap gap-4 ${card}`}>
            <span className={`text-xs font-semibold uppercase tracking-widest ${muted}`}>테스트 감도</span>
            <div className="flex gap-6">
              <div className="text-center">
                <p className={`text-xs mb-0.5 ${muted}`}>DPI</p>
                <p className={`text-lg font-black ${text}`}>{userSetup.dpi}</p>
              </div>
              <div className="text-center">
                <p className={`text-xs mb-0.5 ${muted}`}>발로란트 감도</p>
                <p className={`text-lg font-black ${text}`}>{userSetup.valorantSens}</p>
              </div>
              <div className="text-center">
                <p className={`text-xs mb-0.5 ${muted}`}>eDPI</p>
                <p className="text-lg font-black text-[#FF4655]">{userSetup.eDPI}</p>
              </div>
            </div>
          </div>

          {/* 테스트 결과 3개 카드 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">

            {/* Test 1 */}
            <div className={`rounded-3xl border p-6 transition-all hover:-translate-y-1 hover:shadow-lg ${card}`}>
              <p className={`text-xs font-semibold uppercase tracking-widest mb-3 ${muted}`}>
                Test 1 · Rotation
              </p>
              <p className={`text-4xl font-black mb-1 ${text}`}>
                {allData.test1?.avgMovement?.toFixed(0) || 0}
                <span className={`text-sm font-normal ml-1 ${muted}`}>px</span>
              </p>
              <p className={`text-xs mb-2 ${muted}`}>360° 회전 시 마우스 이동량</p>
              {allData.test1?.deviationDeg !== undefined && (
                <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold ${
                  allData.test1.deviationDeg <= 10
                    ? 'bg-green-500/15 text-green-500'
                    : allData.test1.deviationDeg <= 25
                    ? 'bg-yellow-500/15 text-yellow-500'
                    : 'bg-[#FF4655]/15 text-[#FF4655]'
                }`}>
                  각도 편차 {allData.test1.deviationDeg}°
                </span>
              )}
            </div>

            {/* Test 2 */}
            <div className={`rounded-3xl border p-6 transition-all hover:-translate-y-1 hover:shadow-lg ${card}`}>
              <p className={`text-xs font-semibold uppercase tracking-widest mb-3 ${muted}`}>
                Test 2 · Flicking
              </p>
              <p className={`text-4xl font-black mb-1 ${text}`}>{test2Level}</p>
              <p className={`text-xs mb-2 ${muted}`}>
                Hit {test2Score} · Miss {test2Misses} · 순점수 {test2Diff}
              </p>
              {allData.test2?.recommendation && (
                <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold ${
                  allData.test2.recommendation.includes('낮춤')
                    ? 'bg-blue-500/15 text-blue-400'
                    : allData.test2.recommendation.includes('높임')
                    ? 'bg-[#FF4655]/15 text-[#FF4655]'
                    : 'bg-green-500/15 text-green-500'
                }`}>
                  {allData.test2.recommendation}
                </span>
              )}
            </div>

            {/* Test 3 */}
            <div className={`rounded-3xl border p-6 transition-all hover:-translate-y-1 hover:shadow-lg ${card}`}>
              <p className={`text-xs font-semibold uppercase tracking-widest mb-3 ${muted}`}>
                Test 3 · Tapping
              </p>
              <p className={`text-4xl font-black mb-1 ${text}`}>
                {allData.test3?.tappingAccuracy || 0}
                <span className={`text-sm font-normal ml-1 ${muted}`}>%</span>
              </p>
              <p className={`text-xs mb-2 ${muted}`}>
                정지 타겟 탭샷 정확도 ({allData.test3?.hits || 0} / {allData.test3?.total || 20})
              </p>
              {allData.test3?.avgReactionTime > 0 && (
                <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold ${
                  allData.test3.avgReactionTime < 400
                    ? 'bg-green-500/15 text-green-500'
                    : allData.test3.avgReactionTime < 700
                    ? 'bg-yellow-500/15 text-yellow-500'
                    : 'bg-[#FF4655]/15 text-[#FF4655]'
                }`}>
                  평균 반응속도 {allData.test3.avgReactionTime}ms
                </span>
              )}
            </div>
          </div>

          {/* 플릭킹 분석 디테일 */}
          {allData.test2?.detail && (
            <div className={`rounded-2xl border px-5 py-4 mb-6 text-sm ${card}`}>
              <span className={`font-bold mr-2 ${text}`}>플릭킹 정밀 분석:</span>
              <span className={muted}>{allData.test2.detail}</span>
            </div>
          )}

          {/* 감도 추천 */}
          {recommendedSens && (
            <div className={`rounded-3xl border p-8 ${card}`}>
              <h2 className={`text-xl font-bold mb-6 text-center ${text}`}>
                감도 추천
              </h2>

              {/* 현재 vs 추천 */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                {/* 현재 */}
                <div className={`rounded-2xl p-5 ${dark ? 'bg-[#0F1923]' : 'bg-[#F5F0EA]'}`}>
                  <p className={`text-xs font-semibold uppercase tracking-widest mb-4 ${muted}`}>
                    현재 감도
                  </p>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className={`text-xs ${muted}`}>DPI</span>
                      <span className={`font-bold ${text}`}>{recommendedSens.dpi}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className={`text-xs ${muted}`}>감도</span>
                      <span className={`font-bold text-lg ${text}`}>{recommendedSens.currentSens}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className={`text-xs ${muted}`}>eDPI</span>
                      <span className={`font-bold text-lg ${muted}`}>{recommendedSens.currentEDPI}</span>
                    </div>
                  </div>
                </div>

                {/* 추천 */}
                <div className="rounded-2xl p-5 border-2 border-[#FF4655] relative" style={dark ? { background: 'rgba(255,70,85,0.05)' } : { background: 'rgba(255,70,85,0.04)' }}>
                  <p className="text-xs font-semibold uppercase tracking-widest mb-4 text-[#FF4655]">
                    추천 감도
                  </p>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className={`text-xs ${muted}`}>DPI</span>
                      <span className={`font-bold ${text}`}>{recommendedSens.dpi}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className={`text-xs ${muted}`}>감도</span>
                      <span className="font-black text-2xl text-[#FF4655]">{recommendedSens.valorantSens}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className={`text-xs ${muted}`}>eDPI</span>
                      <span className="font-bold text-lg text-[#FF4655]">{recommendedSens.eDPI}</span>
                    </div>
                  </div>
                  {parseFloat(recommendedSens.delta) !== 0 && (
                    <div className={`absolute -top-3 -right-3 px-2.5 py-1 rounded-full text-xs font-black text-white ${
                      parseFloat(recommendedSens.delta) < 0 ? 'bg-blue-500' : 'bg-[#FF4655]'
                    }`}>
                      {parseFloat(recommendedSens.delta) > 0 ? '+' : ''}{recommendedSens.delta}
                    </div>
                  )}
                </div>
              </div>

              {/* 변화 설명 */}
              <div className={`rounded-2xl px-5 py-3.5 text-sm text-center mb-6 ${
                parseFloat(recommendedSens.delta) === 0
                  ? dark ? 'bg-green-500/10 text-green-400' : 'bg-green-50 text-green-700'
                  : parseFloat(recommendedSens.delta) < 0
                  ? dark ? 'bg-blue-500/10 text-blue-400' : 'bg-blue-50 text-blue-700'
                  : dark ? 'bg-[#FF4655]/10 text-[#FF4655]' : 'bg-red-50 text-red-700'
              }`}>
                {parseFloat(recommendedSens.delta) === 0
                  ? '현재 감도가 테스트 결과와 잘 맞습니다.'
                  : parseFloat(recommendedSens.delta) < 0
                  ? `감도를 ${Math.abs(parseFloat(recommendedSens.delta)).toFixed(2)} 낮추세요. 오버슈트 또는 제어 불안정 경향이 있습니다.`
                  : `감도를 ${parseFloat(recommendedSens.delta).toFixed(2)} 높이세요. 언더슈트 또는 반응 여유가 있습니다.`
                }
              </div>

              <p className={`text-xs text-center mb-6 ${muted}`}>
                현재 테스트 데이터 기준 추정값입니다. 실제 게임에서 몇 판 플레이하며 미세 조정해 보세요.
              </p>

              <div className={`pt-6 border-t flex justify-center ${dark ? 'border-[#2A3D4F]' : 'border-[#DDD8D2]'}`}>
                <button
                  onClick={handleRestart}
                  className={`px-7 py-3 rounded-2xl font-semibold text-sm transition-all hover:-translate-y-0.5 ${
                    dark
                      ? 'bg-[#2A3D4F] text-[#ECE8E1] hover:bg-[#2A3D4F]/80'
                      : 'bg-[#1A1F2E] text-white hover:bg-[#1A1F2E]/90'
                  }`}
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
