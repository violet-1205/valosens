import { useState, useRef, useEffect, useCallback } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
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

function Scene({ sensitivity, markers = [], onCameraReady, onSphereClick, theme = 'dark' }) {
  const { camera, raycaster, scene } = useThree()

  useEffect(() => {
    if (onCameraReady) onCameraReady(camera)
  }, [camera, onCameraReady])

  const handleMouseDown = useCallback(() => {
      if (markers.length === 0) return 
      
      raycaster.setFromCamera({ x: 0, y: 0 }, camera)
      const intersects = raycaster.intersectObjects(scene.children, true)
      
      const sphereHit = intersects.find(
        (hit) => hit.object.userData.isMarker
      )
      
      if (sphereHit) {
          onSphereClick()
      }
  }, [camera, raycaster, scene, markers, onSphereClick])

  useEffect(() => {
    window.addEventListener('mousedown', handleMouseDown)
    return () => window.removeEventListener('mousedown', handleMouseDown)
  }, [handleMouseDown])

  return (
    <>
      <PlayerController sensitivityMultiplier={sensitivity} />
      <color attach="background" args={[theme === 'dark' ? '#0F1923' : '#f5f0ea']} />
      <ambientLight intensity={0.7} />
      <directionalLight position={[4, 8, 4]} intensity={1.5} castShadow />
      <pointLight position={[-6, 4, -6]} intensity={0.4} color="#ffe0cc" />
      {markers.map((pos, index) => (
        <mesh key={index} position={pos} userData={{ isMarker: true }} castShadow>
          <sphereGeometry args={[0.3, 64, 64]} />
          <meshStandardMaterial
            color="#22c55e"
            emissive="#22c55e"
            emissiveIntensity={0.15}
            roughness={0.25}
            metalness={0.1}
          />
        </mesh>
      ))}
    </>
  )
}

export default function RotationSim({ onComplete, sensitivity, theme = 'dark' }) {
  const [movement, setMovement] = useState(0)
  const [started, setStarted] = useState(false)
  const [isPointerLocked, setIsPointerLocked] = useState(false)
  const [clickCount, setClickCount] = useState(0)
  const [markers, setMarkers] = useState([])
  const [hasFirstClick, setHasFirstClick] = useState(false)
  const containerRef = useRef(null)
  const cameraRef = useRef(null)
  const startYawRef = useRef(0)

  const bg = theme === 'dark' ? 'bg-[#0F1923]' : 'bg-[#f5f0ea]'

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
      const promise = element.requestPointerLock({
        unadjustedMovement: true,
      })
      if (promise && promise.catch) {
        promise.catch(() => element.requestPointerLock())
      }
    }
  }
  
  // Removed pathLength logic as we use raw pixel movement now

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!document.pointerLockElement) return
      if (!started || clickCount !== 1) return // Only record movement after first click
      
      const { movementX } = e
      // Accumulate raw horizontal movement (pixels)
      setMovement((prev) => prev + Math.abs(movementX))
    }
    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [started, clickCount])

  const handleContainerClick = () => {
    if (!started) return
    if (!isPointerLocked) {
      requestLock()
      return
    }
    
    // Logic:
    // Click 1: Spawn green sphere at center of view. Start recording.
    // Click 2 (on sphere): Handled by Scene component. Stop recording. Complete test.
    
    if (clickCount === 0) {
        const camera = cameraRef.current
        if (camera) {
            startYawRef.current = camera.rotation.y
            const dir = new THREE.Vector3()
            camera.getWorldDirection(dir)
            const distance = 5
            const worldPos = camera.position.clone().add(dir.multiplyScalar(distance))
            setMarkers([worldPos.toArray()])
            setClickCount(1)
            setMovement(0)
        }
    }
  }

  const handleSphereClick = () => {
      if (clickCount === 1) {
        if (document.pointerLockElement) {
            document.exitPointerLock()
        }
        setStarted(false)
        const camera = cameraRef.current
        let deviationDeg = 0
        if (camera) {
            const totalRotation = camera.rotation.y - startYawRef.current
            const deviationRad = Math.abs(Math.abs(totalRotation) - 2 * Math.PI)
            deviationDeg = parseFloat((deviationRad * 180 / Math.PI).toFixed(1))
        }
        onComplete({ avgMovement: movement, deviationDeg })
      }
  }

  return (
    <div
      ref={containerRef}
      className={`w-full h-full relative ${bg} ${isPointerLocked ? 'cursor-none' : 'cursor-default'}`}
      onClick={handleContainerClick}
    >
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
              360° 회전 테스트
            </h2>
            <p
              className={`mb-6 leading-relaxed ${
                theme === 'light' ? 'text-[#1A1F2E]/70' : 'text-[#ECE8E1]/70'
              }`}
            >
              3D 환경에서 마우스를 움직여 360° 회전할 때의 실제 이동량을 측정합니다.
            </p>
            <p
              className={`mb-6 text-xs ${
                theme === 'light' ? 'text-[#7A7E85]' : 'text-[#768079]'
              }`}
            >
              시작 지점을 클릭하고, 360° 회전 후 다시 같은 지점을 클릭하세요.
            </p>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                setMovement(0)
                setClickCount(0)
                setMarkers([])
                setHasFirstClick(false)
                setStarted(true)
                requestLock()
              }}
              className="px-10 py-4 rounded-2xl bg-[#ff4655] text-white font-bold hover:bg-[#ff4655]/90 transition-all hover:scale-105 shadow-lg shadow-red-500/20"
            >
              테스트 시작
            </button>
          </div>
        </div>
      )}

      {started && !isPointerLocked && (
        <div className="absolute inset-0 z-[25] pointer-events-none flex items-center justify-center bg-black/40 backdrop-blur-[2px]">
          <div className="text-center animate-bounce">
            <p className="text-white text-xl font-bold bg-[#ff4655] px-6 py-3 rounded-2xl shadow-2xl">
              화면을 클릭하여 마우스를 고정하세요
            </p>
          </div>
        </div>
      )}

      <div
        className={`absolute inset-0 pointer-events-none z-20 flex items-center justify-center transition-opacity duration-300 ${
          started && isPointerLocked ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <div className="relative w-6 h-6">
          <div className="absolute top-1/2 left-0 w-full h-[2px] bg-[#4ade80] -translate-y-1/2 shadow-[0_0_8px_rgba(74,222,128,0.8)]" />
          <div className="absolute left-1/2 top-0 w-[2px] h-full bg-[#4ade80] -translate-x-1/2 shadow-[0_0_8px_rgba(74,222,128,0.8)]" />
          <div className="absolute top-1/2 left-1/2 w-1 h-1 bg-white -translate-x-1/2 -translate-y-1/2" />
        </div>
      </div>

      {started && clickCount === 0 && (
          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-20 px-4 py-2 bg-black/50 text-white/90 text-sm rounded-xl backdrop-blur border border-white/20">
              시작 지점을 바라보고 클릭하세요
          </div>
      )}
      {started && clickCount === 1 && (
          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-20 px-4 py-2 bg-[#ff4655]/80 text-white font-bold text-sm rounded-xl backdrop-blur shadow-lg animate-pulse">
              360도 회전 후 처음 지점을 다시 클릭하세요!
          </div>
      )}

      <div className="absolute top-4 right-4 z-20 px-4 py-2 rounded-xl bg-black/50 text-white/80 text-xs border border-white/10 backdrop-blur flex flex-col gap-1 text-right">
        <div>
          <span className="text-slate-400 mr-1">현재 이동량</span>
          <span className="font-semibold text-white">{movement.toFixed(0)} px</span>
        </div>
      </div>

      <Canvas shadows camera={{ position: [0, 0, 0], fov: 75 }}>
        {started && (
          <>
            <PerspectiveCamera makeDefault position={[0, 0, 0]} fov={75} />
            <Scene
              sensitivity={sensitivity}
              markers={markers}
              onCameraReady={(camera) => {
                cameraRef.current = camera
              }}
              onSphereClick={handleSphereClick}
              theme={theme}
            />
          </>
        )}
      </Canvas>
    </div>
  )
}
