import { useRef, useEffect } from 'react'
import { useThree, useFrame } from '@react-three/fiber'
import * as THREE from 'three'

// Pre-allocate — no GC pressure per frame
const _offset = new THREE.Vector3()
const _euler  = new THREE.Euler(0, 0, 0, 'YXZ')
const _localQ = new THREE.Quaternion()

// Shared materials (created once)
const gunMat   = new THREE.MeshStandardMaterial({ color: '#1a1a1f', roughness: 0.45, metalness: 0.82 })
const slideMat = new THREE.MeshStandardMaterial({ color: '#141418', roughness: 0.35, metalness: 0.90 })
const gripMat  = new THREE.MeshStandardMaterial({ color: '#111114', roughness: 0.80, metalness: 0.10 })
const skinMat  = new THREE.MeshStandardMaterial({ color: '#c8956c', roughness: 0.75, metalness: 0.00 })
const flashMat = new THREE.MeshBasicMaterial({ color: '#ffdd33', transparent: true, opacity: 0.92 })

export default function GunViewModel({ active = true }) {
  const groupRef      = useRef()
  const slideRef      = useRef()
  const muzzleRef     = useRef()
  const flashLightRef = useRef()
  const spring        = useRef({ pos: 0, vel: 0 })
  const flashTimer    = useRef(0)
  const { camera }    = useThree()

  /* ── Fire trigger ───────────────────────────────────────────── */
  useEffect(() => {
    const onDown = () => {
      if (!active) return
      spring.current.vel = 0.06
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
    spring.current.vel = vel + (-pos * 24 - vel * 10) * dt
    spring.current.pos = pos + spring.current.vel * dt
    const recoil = spring.current.pos

    // Slide recoil (moves back on fire)
    if (slideRef.current) {
      slideRef.current.position.z = recoil * 0.18
    }

    // Muzzle flash
    flashTimer.current = Math.max(0, flashTimer.current - dt)
    const ft = flashTimer.current / 0.10
    if (muzzleRef.current) {
      muzzleRef.current.visible = ft > 0.05
      muzzleRef.current.scale.setScalar(ft * 0.9 + 0.1)
    }
    if (flashLightRef.current) flashLightRef.current.intensity = ft * 2.5

    // Position: bottom-right of camera view
    _offset.set(0.28, -0.22, -0.50)
    _offset.applyQuaternion(camera.quaternion)
    _offset.add(camera.position)
    groupRef.current.position.copy(_offset)

    // Rotation: camera + natural hold angle + recoil
    _euler.set(
      -0.05 - recoil * 2.8,   // recoil kick
       0.10,                    // slight inward yaw
      -0.04                    // slight roll
    )
    _localQ.setFromEuler(_euler)
    groupRef.current.quaternion.multiplyQuaternions(camera.quaternion, _localQ)

    groupRef.current.visible = active
  })

  return (
    <group ref={groupRef}>

      {/* ── PISTOL ─────────────────────────────────────────────── */}
      <group>
        {/* Frame / Lower receiver */}
        <mesh material={gunMat} position={[0, 0, 0.04]}>
          <boxGeometry args={[0.072, 0.11, 0.26]} />
        </mesh>

        {/* Slide (upper receiver) — moves back on recoil */}
        <group ref={slideRef}>
          <mesh material={slideMat} position={[0, 0.062, -0.01]}>
            <boxGeometry args={[0.068, 0.062, 0.28]} />
          </mesh>
          {/* Ejection port cutout visual (thin dark slot) */}
          <mesh material={gripMat} position={[0.036, 0.062, 0.01]}>
            <boxGeometry args={[0.004, 0.028, 0.08]} />
          </mesh>
          {/* Front sight */}
          <mesh material={slideMat} position={[0, 0.098, -0.125]}>
            <boxGeometry args={[0.010, 0.016, 0.012]} />
          </mesh>
          {/* Rear sight */}
          <mesh material={slideMat} position={[0, 0.098, 0.098]}>
            <boxGeometry args={[0.036, 0.016, 0.014]} />
          </mesh>
        </group>

        {/* Barrel (extends forward from slide) */}
        <mesh material={slideMat} position={[0, 0.055, -0.20]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.016, 0.016, 0.10, 10]} />
        </mesh>

        {/* Trigger guard */}
        <mesh material={gunMat} position={[0, -0.028, 0.06]}>
          <torusGeometry args={[0.026, 0.006, 6, 12, Math.PI]} />
        </mesh>

        {/* Trigger */}
        <mesh material={gripMat} position={[0, -0.022, 0.04]} rotation={[0.3, 0, 0]}>
          <boxGeometry args={[0.008, 0.030, 0.008]} />
        </mesh>

        {/* Grip / Handle */}
        <mesh material={gripMat} position={[0, -0.085, 0.115]} rotation={[-0.22, 0, 0]}>
          <boxGeometry args={[0.066, 0.115, 0.072]} />
        </mesh>

        {/* Magazine base */}
        <mesh material={gunMat} position={[0, -0.148, 0.118]} rotation={[-0.22, 0, 0]}>
          <boxGeometry args={[0.062, 0.018, 0.068]} />
        </mesh>

        {/* Muzzle flash */}
        <mesh ref={muzzleRef} position={[0, 0.055, -0.26]} visible={false} material={flashMat}>
          <sphereGeometry args={[0.038, 8, 8]} />
        </mesh>
        <pointLight
          ref={flashLightRef}
          position={[0, 0.055, -0.26]}
          color="#ff9900"
          intensity={0}
          distance={1.6}
          decay={2}
        />
      </group>

      {/* ── HAND / WRIST ────────────────────────────────────────── */}
      <group position={[0, -0.072, 0.13]}>
        {/* Palm */}
        <mesh material={skinMat} position={[0, 0, 0]} rotation={[-0.22, 0, 0]}>
          <boxGeometry args={[0.082, 0.090, 0.078]} />
        </mesh>

        {/* Index finger */}
        <mesh material={skinMat} position={[-0.022, 0.025, -0.066]} rotation={[-0.55, 0, 0.08]}>
          <capsuleGeometry args={[0.011, 0.048, 4, 8]} />
        </mesh>
        {/* Middle finger */}
        <mesh material={skinMat} position={[-0.004, 0.030, -0.068]} rotation={[-0.50, 0, 0.02]}>
          <capsuleGeometry args={[0.012, 0.052, 4, 8]} />
        </mesh>
        {/* Ring finger */}
        <mesh material={skinMat} position={[0.018, 0.024, -0.064]} rotation={[-0.48, 0, -0.06]}>
          <capsuleGeometry args={[0.011, 0.046, 4, 8]} />
        </mesh>
        {/* Pinky */}
        <mesh material={skinMat} position={[0.036, 0.014, -0.056]} rotation={[-0.42, 0, -0.14]}>
          <capsuleGeometry args={[0.009, 0.036, 4, 8]} />
        </mesh>
        {/* Thumb */}
        <mesh material={skinMat} position={[-0.048, 0.012, -0.018]} rotation={[0.10, 0, -0.85]}>
          <capsuleGeometry args={[0.012, 0.040, 4, 8]} />
        </mesh>

        {/* Wrist */}
        <mesh material={skinMat} position={[0, -0.010, 0.072]} rotation={[-0.22, 0, 0]}>
          <cylinderGeometry args={[0.036, 0.040, 0.095, 10]} />
        </mesh>
      </group>

    </group>
  )
}
