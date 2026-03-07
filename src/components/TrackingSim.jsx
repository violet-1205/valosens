import { useState, useRef, useEffect, useCallback } from 'react'
import { Canvas, useThree, useFrame } from '@react-three/fiber'
import { PerspectiveCamera } from '@react-three/drei'
import * as THREE from 'three'

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

function TrackingTarget({ onScore }) {
  const meshRef = useRef(null)
  const [velocity] = useState(() => {
    const speed = 4
    const dir = new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.5, 0)
    if (dir.lengthSq() === 0) dir.set(1, 0, 0)
    dir.normalize().multiplyScalar(speed)
    return dir
  })
  const { camera, raycaster } = useThree()

  useFrame((_, delta) => {
    if (!meshRef.current) return
    const newPos = meshRef.current.position.clone().add(velocity.clone().multiplyScalar(delta))
    if (Math.abs(newPos.x) > 5) {
      velocity.x *= -1
      newPos.x = THREE.MathUtils.clamp(newPos.x, -5, 5)
    }
    const minY = -1.5
    const maxY = 3
    if (newPos.y < minY || newPos.y > maxY) {
      velocity.y *= -1
      newPos.y = THREE.MathUtils.clamp(newPos.y, minY, maxY)
    }
    meshRef.current.position.copy(newPos)
    raycaster.setFromCamera({ x: 0, y: 0 }, camera)
    const intersects = raycaster.intersectObject(meshRef.current)
    if (intersects.length > 0) {
      onScore(delta)
    }
  })

  return (
    <mesh ref={meshRef} position={[0, 0, -5]}>
      <sphereGeometry args={[0.3, 32, 32]} />
      <meshStandardMaterial color="#ff4655" emissive="#ff4655" emissiveIntensity={0.8} />
    </mesh>
  )
}

function Scene({ onScore, sensitivity }) {
  return (
    <>
      <PlayerController sensitivityMultiplier={sensitivity} />
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} intensity={1} />
      <TrackingTarget onScore={onScore} />
      <gridHelper args={[50, 50, 0x444444, 0x222222]} position={[0, -2, 0]} />
    </>
  )
}

export default function TrackingSim({ onComplete, sensitivity, theme = 'dark' }) {
  const [score, setScore] = useState(0)
  const [onTargetTime, setOnTargetTime] = useState(0)
  const [timeLeft, setTimeLeft] = useState(20)
  const [started, setStarted] = useState(false)
  const [countdown, setCountdown] = useState(0)
  const [isPointerLocked, setIsPointerLocked] = useState(false)
  const containerRef = useRef(null)

  const bg = theme === 'light' ? 'bg-white' : 'bg-slate-900'

  useEffect(() => {
    const handleLockChange = () => {
      setIsPointerLocked(!!document.pointerLockElement)
    }
    document.addEventListener('pointerlockchange', handleLockChange)
    return () => document.removeEventListener('pointerlockchange', handleLockChange)
  }, [])

  const handleScore = useCallback(
    (delta) => {
      setScore((s) => s + 1)
      setOnTargetTime((t) => t + delta)
    },
    []
  )

  const requestLock = () => {
    if (containerRef.current && !isPointerLocked) {
      const element = containerRef.current
      const promise = element.requestPointerLock({
        unadjustedMovement: true,
      })
      if (promise && promise.catch) {
        promise.catch(() => element.requestPointerLock())
      }
    }
  }

  useEffect(() => {
    if (!started) return
    if (countdown !== 0) return
    if (timeLeft <= 0) return
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [started, countdown, timeLeft])

  useEffect(() => {
    if (!started || timeLeft !== 0) return
    if (document.pointerLockElement) {
      document.exitPointerLock()
    }
    const totalTime = 20
    const accuracy = Math.min(Math.round((onTargetTime / totalTime) * 100), 100)
    onComplete({ trackingAccuracy: accuracy })
  }, [started, timeLeft, onTargetTime, onComplete])

  useEffect(() => {
    if (!started) return
    if (countdown <= 0) return
    const timer = setTimeout(() => {
      setCountdown((prev) => prev - 1)
    }, 1000)
    return () => clearTimeout(timer)
  }, [started, countdown])

  return (
    <div
      ref={containerRef}
      className={`w-full h-full relative ${bg} ${isPointerLocked ? 'cursor-none' : 'cursor-default'}`}
      onClick={requestLock}
    >
      {!started && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div
            className={`text-center p-8 border shadow-2xl max-w-md ${
              theme === 'light'
                ? 'bg-white/95 border-slate-200 text-slate-900'
                : 'bg-slate-800 border-white/10 text-white'
            }`}
          >
            <h2
              className={`text-3xl font-black mb-4 ${
                theme === 'light' ? 'text-slate-900' : 'text-white'
              }`}
            >
              트래킹 테스트
            </h2>
            <p
              className={`mb-6 leading-relaxed ${
                theme === 'light' ? 'text-slate-700' : 'text-slate-300'
              }`}
            >
              움직이는 타겟을 조준점으로 따라가는 능력을 측정합니다.
            </p>
            <p
              className={`mb-6 text-xs ${
                theme === 'light' ? 'text-slate-500' : 'text-slate-400'
              }`}
            >
              20초 동안 타겟을 최대한 정확하게 따라가며 조준을 유지해 보세요.
            </p>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                setScore(0)
                setOnTargetTime(0)
                setTimeLeft(20)
                setCountdown(3)
                setStarted(true)
                requestLock()
              }}
              className="px-10 py-4 bg-[#ff4655] text-white font-bold hover:bg-[#ff4655]/90 transition-all transform hover:scale-105 shadow-lg shadow-red-500/20"
            >
              테스트 시작
            </button>
          </div>
        </div>
      )}

      {started && !isPointerLocked && (
        <div className="absolute inset-0 z-[25] pointer-events-none flex items-center justify-center bg-black/40 backdrop-blur-[2px]">
          <div className="text-center animate-bounce">
            <p className="text-white text-xl font-bold bg-[#ff4655] px-6 py-3 shadow-2xl">
              화면을 클릭하여 마우스를 고정하세요
            </p>
          </div>
        </div>
      )}

      <div
        className={`absolute inset-0 pointer-events-none z-20 flex items-center justify-center transition-opacity duration-300 ${
          started && countdown === 0 && isPointerLocked ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <div className="relative w-6 h-6">
          <div className="absolute top-1/2 left-0 w-full h-[2px] bg-[#4ade80] -translate-y-1/2 shadow-[0_0_8px_rgba(74,222,128,0.8)]" />
          <div className="absolute left-1/2 top-0 w-[2px] h-full bg-[#4ade80] -translate-x-1/2 shadow-[0_0_8px_rgba(74,222,128,0.8)]" />
          <div className="absolute top-1/2 left-1/2 w-1 h-1 bg-white -translate-x-1/2 -translate-y-1/2" />
        </div>
      </div>

      {started && countdown > 0 && (
        <div className="absolute inset-0 z-[26] flex items-center justify-center bg-black/60">
          <div className="text-white text-6xl md:text-7xl font-black drop-shadow-[0_0_20px_rgba(0,0,0,0.8)]">
            {countdown}
          </div>
        </div>
      )}

      <div className="absolute right-5 top-[110px] z-[1000] text-white font-mono text-xl space-y-2 bg-black/55 p-4 backdrop-blur-md border border-white/15 text-right shadow-lg">
        <div className="flex justify-between gap-4">
          <span className="text-slate-400">Score</span>
          <span className="font-bold text-[#ff4655]">{score}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-slate-400">Time</span>
          <span className="font-bold text-red-400">{timeLeft}s</span>
        </div>
      </div>

      <Canvas shadows camera={{ position: [0, 0, 0], fov: 75 }}>
        {started && countdown === 0 && (
          <>
            <PerspectiveCamera makeDefault position={[0, 0, 0]} fov={75} />
            <Scene
              onScore={handleScore}
              sensitivity={sensitivity}
            />
          </>
        )}
      </Canvas>

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 text-white/50 text-sm text-center bg-black/40 px-6 py-2 backdrop-blur-md border border-white/10">
        {started
          ? countdown > 0
            ? '3, 2, 1 카운트다운 이후에 타겟이 움직입니다.'
            : isPointerLocked
            ? '마우스가 고정되었습니다. 조준하여 타겟을 따라가세요.'
            : '화면을 클릭하여 마우스를 고정하세요.'
          : '테스트 시작 버튼을 누르세요.'}
      </div>
    </div>
  )
}
