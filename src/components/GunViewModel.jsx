import { useRef, useEffect, useMemo } from 'react'
import { useThree, useFrame } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'

// Pre-allocate — no GC pressure per frame
const _offset = new THREE.Vector3()
const _euler  = new THREE.Euler(0, 0, 0, 'YXZ')
const _localQ = new THREE.Quaternion()

const MODEL_PATH = '/valorant_-_phantom_-_fan_art.glb'

export default function GunViewModel({ active = true }) {
  const groupRef      = useRef()
  const muzzleRef     = useRef()
  const flashLightRef = useRef()
  const spring        = useRef({ pos: 0, vel: 0 })
  const flashTimer    = useRef(0)
  const { camera }    = useThree()

  /* ── Load GLB ───────────────────────────────────────────────── */
  const { scene } = useGLTF(MODEL_PATH)
  // Clone so multiple renders don't share the same Three.js object
  const model = useMemo(() => {
    const clone = scene.clone(true)
    // Make sure all meshes cast/receive light properly
    clone.traverse((node) => {
      if (node.isMesh) {
        node.frustumCulled = false
      }
    })
    return clone
  }, [scene])

  /* ── Fire trigger ───────────────────────────────────────────── */
  useEffect(() => {
    const onDown = () => {
      if (!active) return
      spring.current.vel = 0.07
      flashTimer.current = 0.10
    }
    window.addEventListener('mousedown', onDown)
    return () => window.removeEventListener('mousedown', onDown)
  }, [active])

  /* ── Per-frame: spring + position + flash ───────────────────── */
  useFrame((_, dt) => {
    if (!groupRef.current) return

    // Spring physics (recoil)
    const { pos, vel } = spring.current
    spring.current.vel = vel + (-pos * 22 - vel * 9) * dt
    spring.current.pos = pos + spring.current.vel * dt

    // Muzzle flash
    flashTimer.current = Math.max(0, flashTimer.current - dt)
    const ft = flashTimer.current / 0.10
    if (muzzleRef.current) {
      muzzleRef.current.visible = ft > 0.05
      muzzleRef.current.scale.setScalar(ft)
    }
    if (flashLightRef.current) flashLightRef.current.intensity = ft * 2.0

    // Position: bottom-right of camera view
    // x: right,  y: down,  z: forward depth
    _offset.set(0.32, -0.24, -0.52)
    _offset.applyQuaternion(camera.quaternion)
    _offset.add(camera.position)
    groupRef.current.position.copy(_offset)

    // Rotation: camera + natural hold angle + recoil
    _euler.set(
      -0.04 - spring.current.pos * 2.6,  // recoil (barrel kicks up)
       0.12,                               // slight right tilt
       0.0
    )
    _localQ.setFromEuler(_euler)
    groupRef.current.quaternion.multiplyQuaternions(camera.quaternion, _localQ)

    groupRef.current.visible = active
  })

  return (
    <group ref={groupRef}>
      {/*
        Scale / rotation tune guide:
          - scale: 총 크기 (너무 크면 줄이고 작으면 늘려)
          - rotation[1]: Y축 회전 — Math.PI 면 180° (총구가 앞으로)
          - rotation[0]: X축 — 총이 위아래로 기울어질 때 조정
          - position: 그룹 내 오프셋 (총 모델 원점이 다를 경우)
      */}
      <primitive
        object={model}
        scale={0.018}
        rotation={[0, Math.PI, 0]}
        position={[0, 0, 0]}
      />

      {/* Muzzle flash — 총구 앞쪽에 위치 (총 모델에 맞게 조정 필요) */}
      <mesh ref={muzzleRef} position={[0, 0.02, -0.55]} visible={false}>
        <sphereGeometry args={[0.04, 8, 8]} />
        <meshBasicMaterial color="#ffdd33" transparent opacity={0.92} />
      </mesh>
      <pointLight
        ref={flashLightRef}
        position={[0, 0.02, -0.55]}
        color="#ff8800"
        intensity={0}
        distance={1.8}
        decay={2}
      />
    </group>
  )
}

// 모델 사전 로드 (첫 렌더 지연 방지)
useGLTF.preload(MODEL_PATH)
