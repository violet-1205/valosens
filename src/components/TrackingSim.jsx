import { useState, useRef, useEffect, useCallback, Suspense } from 'react'
import { playHit, playMiss } from '../utils/sounds'
import { Canvas, useThree, useFrame } from '@react-three/fiber'
import Crosshair from './Crosshair'
import GunViewModel from './GunViewModel'
import { PerspectiveCamera } from '@react-three/drei'
import * as THREE from 'three'

const TOTAL_TARGETS = 20
const TIME_LIMIT_MS = 500

function PlayerController({ sensitivityMultiplier = 1 }) {
  const { camera } = useThree()
  const rotation = useRef(new THREE.Euler(0, 0, 0, 'YXZ'))

  const handleMouseMove = useCallback(
    (e) => {
      if (!document.pointerLockElement) return
      const { movementX, movementY } = e
      const baseSensitivity = 0.002
      const finalSensitivity = baseSensitivity * sensitivityMultiplier
      rotation.current.y -= movementX * finalSensitivity
      rotation.current.x -= movementY * finalSensitivity
      rotation.current.x = Math.max(-Math.PI / 2.2, Math.min(Math.PI / 2.2, rotation.current.x))
      camera.rotation.copy(rotation.current)
    },
    [camera, sensitivityMultiplier]
  )

  useEffect(() => {
    camera.rotation.order = 'YXZ'
    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [camera, handleMouseMove])

  return null
}

// 정지 타겟 - 일정 시간 후 자동 소멸, 클릭 시 hit 판정
function TappingTarget({ position, timeLimit, onHit, onMiss }) {
  const meshRef = useRef(null)
  const spawnTime = useRef(performance.now())
  const resolved = useRef(false)
  const { camera, raycaster } = useThree()

  useFrame(() => {
    if (resolved.current) return
    if (performance.now() - spawnTime.current >= timeLimit) {
      resolved.current = true
      onMiss()
    }
  })

  const handleMouseDown = useCallback(() => {
    if (resolved.current || !meshRef.current) return
    raycaster.setFromCamera({ x: 0, y: 0 }, camera)
    const intersects = raycaster.intersectObject(meshRef.current)
    if (intersects.length > 0) {
      resolved.current = true
      onHit(performance.now() - spawnTime.current)
    }
  }, [camera, raycaster, onHit])

  useEffect(() => {
    window.addEventListener('mousedown', handleMouseDown)
    return () => window.removeEventListener('mousedown', handleMouseDown)
  }, [handleMouseDown])

  return (
    <mesh ref={meshRef} position={position}>
      <sphereGeometry args={[0.3, 64, 64]} />
      <meshStandardMaterial
        color="#ff4655"
        roughness={0.85}
        metalness={0.0}
      />
    </mesh>
  )
}

function Scene({ onHit, onMiss, sensitivity, targetPos, targetKey, active, theme = 'dark' }) {
  return (
    <>
      <PlayerController sensitivityMultiplier={sensitivity} />
      <color attach="background" args={[theme === 'dark' ? '#0F1923' : '#f5f0ea']} />
      <ambientLight intensity={0.7} />
      <hemisphereLight args={['#e8f4ff', '#c8ccd0', 1.0]} />
      <directionalLight position={[5, 10, 5]} intensity={1.6} />
      {active && targetPos && (
        <TappingTarget
          key={targetKey}
          position={targetPos}
          timeLimit={TIME_LIMIT_MS}
          onHit={onHit}
          onMiss={onMiss}
        />
      )}
    </>
  )
}

export default function TrackingSim({ onComplete, sensitivity, theme = 'dark', onStatsChange }) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [hitsCount, setHitsCount] = useState(0)
  const [targetPos, setTargetPos] = useState(null)
  const [targetKey, setTargetKey] = useState(0)
  const [started, setStarted] = useState(false)
  const [countdown, setCountdown] = useState(0)
  const [isPointerLocked, setIsPointerLocked] = useState(false)
  const containerRef = useRef(null)

  const currentIndexRef = useRef(0)
  const hitsRef = useRef(0)
  const reactionTimesRef = useRef([])
  const firstSpawnDoneRef = useRef(false)

  const bg = theme === 'dark' ? 'bg-[#0F1923]' : 'bg-[#f5f0ea]'

  useEffect(() => {
    onStatsChange?.({ hits: hitsCount, currentIndex, total: TOTAL_TARGETS })
  }, [hitsCount, currentIndex, onStatsChange])

  const spawnTarget = useCallback(() => {
    // 발로란트 실전 에임 범위: 머리 높이 중심, 수평 분포
    const x = (Math.random() - 0.5) * 4.0   // -2 ~ 2
    const y = Math.random() * 1.8 - 0.4      // -0.4 ~ 1.4 (머리 높이 중심)
    setTargetPos([x, y, -5])
    setTargetKey((k) => k + 1)
  }, [])

  const handleHit = useCallback(
    (reactionTime) => {
      playHit()
      hitsRef.current += 1
      setHitsCount(hitsRef.current)
      reactionTimesRef.current.push(reactionTime)
      currentIndexRef.current += 1
      setCurrentIndex(currentIndexRef.current)
      if (currentIndexRef.current < TOTAL_TARGETS) {
        spawnTarget()
      }
    },
    [spawnTarget]
  )

  const handleMiss = useCallback(() => {
    playMiss()
    currentIndexRef.current += 1
    setCurrentIndex(currentIndexRef.current)
    if (currentIndexRef.current < TOTAL_TARGETS) {
      spawnTarget()
    }
  }, [spawnTarget])

  useEffect(() => {
    const handleLockChange = () => {
      setIsPointerLocked(!!document.pointerLockElement)
    }
    document.addEventListener('pointerlockchange', handleLockChange)
    return () => document.removeEventListener('pointerlockchange', handleLockChange)
  }, [])

  const requestLock = () => {
    if (containerRef.current && !isPointerLocked) {
      const element = containerRef.current
      const promise = element.requestPointerLock({ unadjustedMovement: true })
      if (promise && promise.catch) {
        promise.catch(() => element.requestPointerLock())
      }
    }
  }

  // 카운트다운 처리
  useEffect(() => {
    if (!started || countdown <= 0) return
    const timer = setTimeout(() => {
      setCountdown((prev) => prev - 1)
    }, 1000)
    return () => clearTimeout(timer)
  }, [started, countdown])

  // 카운트다운 종료 시 첫 타겟 스폰
  useEffect(() => {
    if (!started || countdown !== 0 || firstSpawnDoneRef.current) return
    firstSpawnDoneRef.current = true
    spawnTarget()
  }, [started, countdown, spawnTarget])

  // 테스트 완료 처리
  useEffect(() => {
    if (!started || currentIndex < TOTAL_TARGETS) return
    if (document.pointerLockElement) document.exitPointerLock()
    const accuracy = Math.round((hitsRef.current / TOTAL_TARGETS) * 100)
    const avgReactionTime =
      reactionTimesRef.current.length > 0
        ? Math.round(
            reactionTimesRef.current.reduce((a, b) => a + b, 0) /
              reactionTimesRef.current.length
          )
        : 0
    onComplete({
      tappingAccuracy: accuracy,
      avgReactionTime,
      hits: hitsRef.current,
      total: TOTAL_TARGETS,
    })
  }, [started, currentIndex, onComplete])

  return (
    <div
      ref={containerRef}
      className={`w-full h-full relative ${bg} ${isPointerLocked ? 'cursor-none' : 'cursor-default'}`}
      onClick={requestLock}
    >
      {/* 시작 오버레이 */}
      {!started && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div
            className={`text-center p-8 rounded-3xl border shadow-2xl max-w-md ${
              theme === 'light'
                ? 'bg-white/95 border-[#DDD8D2] text-[#1A1F2E]'
                : 'bg-[#1B2E3D] border-[#2A3D4F] text-[#ECE8E1]'
            }`}
          >
            <h2 className="text-3xl font-black mb-4">
              탭샷 테스트
            </h2>
            <p
              className={`mb-6 leading-relaxed ${
                theme === 'light' ? 'text-[#1A1F2E]/70' : 'text-[#ECE8E1]/70'
              }`}
            >
              나타나는 정지 타겟을 빠르게 조준하여 클릭하세요.
              각 타겟은 <span className="text-[#ff4655] font-bold">0.5초</span> 후 사라집니다.
            </p>
            <p
              className={`mb-6 text-xs ${
                theme === 'light' ? 'text-[#7A7E85]' : 'text-[#768079]'
              }`}
            >
              총 {TOTAL_TARGETS}개의 타겟 · 발로란트의 멈추고 쏘는 에임 방식을 시뮬레이션합니다.
            </p>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                currentIndexRef.current = 0
                hitsRef.current = 0
                reactionTimesRef.current = []
                firstSpawnDoneRef.current = false
                setCurrentIndex(0)
                setTargetPos(null)
                setTargetKey(0)
                setStarted(true)
                setCountdown(3)
                requestLock()
              }}
              className="px-10 py-4 rounded-2xl bg-[#ff4655] text-white font-bold hover:bg-[#ff4655]/90 transition-all hover:scale-105 shadow-lg shadow-red-500/20"
            >
              테스트 시작
            </button>
          </div>
        </div>
      )}

      {/* 포인터 락 안내 */}
      {started && !isPointerLocked && (
        <div className="absolute inset-0 z-[25] pointer-events-none flex items-center justify-center bg-black/40 backdrop-blur-[2px]">
          <div className="text-center animate-bounce">
            <p className="text-white text-xl font-bold bg-[#ff4655] px-6 py-3 rounded-2xl shadow-2xl">
              화면을 클릭하여 마우스를 고정하세요
            </p>
          </div>
        </div>
      )}

      {/* 크로스헤어 */}
      <Crosshair visible={started && countdown === 0 && isPointerLocked} />

      {/* 카운트다운 */}
      {started && countdown > 0 && (
        <div className="absolute inset-0 z-[26] flex items-center justify-center bg-black/60">
          <div className="text-white text-6xl md:text-7xl font-black drop-shadow-[0_0_20px_rgba(0,0,0,0.8)]">
            {countdown}
          </div>
        </div>
      )}

      {/* 타겟 시간 제한 바 */}
      {started && countdown === 0 && isPointerLocked && (
        <div className="absolute top-0 left-0 w-full z-[999] h-1.5 bg-slate-700/50">
          <div
            key={targetKey}
            className="h-full bg-[#ff4655] origin-left"
            style={{ animation: `shrink-bar ${TIME_LIMIT_MS}ms linear forwards` }}
          />
        </div>
      )}

      <Canvas
        dpr={[1, 2]}
        gl={{ antialias: true, powerPreference: 'high-performance', alpha: false }}
        camera={{ position: [0, 0, 0], fov: 75 }}
      >
        <color attach="background" args={[theme === 'dark' ? '#0F1923' : '#f5f0ea']} />
        {started && countdown === 0 && (
          <>
            <PerspectiveCamera makeDefault position={[0, 0, 0]} fov={75} />
            <Scene
              onHit={handleHit}
              onMiss={handleMiss}
              sensitivity={sensitivity}
              targetPos={targetPos}
              targetKey={targetKey}
              active={currentIndex < TOTAL_TARGETS}
              theme={theme}
            />
            <Suspense fallback={null}>
              <GunViewModel active={isPointerLocked} />
            </Suspense>
          </>
        )}
      </Canvas>

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 text-white/50 text-sm text-center bg-black/40 px-6 py-2 rounded-xl backdrop-blur-md border border-white/10">
        {started
          ? countdown > 0
            ? '3, 2, 1 카운트다운 후 타겟이 나타납니다.'
            : isPointerLocked
            ? '마우스가 고정되었습니다. 조준하여 타겟을 클릭하세요.'
            : '화면을 클릭하여 마우스를 고정하세요.'
          : '테스트 시작 버튼을 누르세요.'}
      </div>
    </div>
  )
}
