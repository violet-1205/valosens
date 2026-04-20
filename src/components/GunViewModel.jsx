import { useRef, useEffect } from 'react'
import { useThree, useFrame } from '@react-three/fiber'
import * as THREE from 'three'

// Pre-allocate to avoid GC pressure per frame
const _offset  = new THREE.Vector3()
const _euler   = new THREE.Euler(0, 0, 0, 'YXZ')
const _localQ  = new THREE.Quaternion()

/* ── Materials ────────────────────────────────────────────────── */
const MAT = {
  slide:    { color: '#1a1c20', roughness: 0.18, metalness: 0.92 },
  frame:    { color: '#24272d', roughness: 0.28, metalness: 0.78 },
  barrel:   { color: '#0d0e10', roughness: 0.06, metalness: 0.99 },
  grip:     { color: '#1c1e23', roughness: 0.78, metalness: 0.18 },
  serrate:  { color: '#101214', roughness: 0.12, metalness: 0.96 },
  sight:    { color: '#d8d8d8', roughness: 0.38, metalness: 0.52 },
  guard:    { color: '#1f2227', roughness: 0.42, metalness: 0.62 },
  mag:      { color: '#161819', roughness: 0.58, metalness: 0.50 },
}

function M({ m, ...rest }) {
  return <meshStandardMaterial {...MAT[m]} {...rest} />
}

export default function GunViewModel({ active = true }) {
  const groupRef     = useRef()
  const muzzleRef    = useRef()
  const flashLightRef = useRef()
  const spring       = useRef({ pos: 0, vel: 0 })
  const flashTimer   = useRef(0)
  const { camera }   = useThree()

  /* ── Fire event ─────────────────────────────────────────────── */
  useEffect(() => {
    const onDown = () => {
      if (!active) return
      spring.current.vel = 0.065        // recoil kick
      flashTimer.current = 0.09         // 90ms muzzle flash
    }
    window.addEventListener('mousedown', onDown)
    return () => window.removeEventListener('mousedown', onDown)
  }, [active])

  /* ── Per-frame update ───────────────────────────────────────── */
  useFrame((_, dt) => {
    if (!groupRef.current) return

    // Spring physics ─ overdamped recoil + return
    const { pos, vel } = spring.current
    spring.current.vel = vel + (-pos * 24 - vel * 9) * dt
    spring.current.pos = pos + spring.current.vel * dt

    // Muzzle flash
    flashTimer.current = Math.max(0, flashTimer.current - dt)
    const ft = flashTimer.current / 0.09
    if (muzzleRef.current)    { muzzleRef.current.visible = ft > 0.05; muzzleRef.current.scale.setScalar(ft) }
    if (flashLightRef.current) flashLightRef.current.intensity = ft * 1.8

    // Position: bottom-right of camera view
    _offset.set(0.27, -0.19, -0.44)
    _offset.applyQuaternion(camera.quaternion)
    _offset.add(camera.position)
    groupRef.current.position.copy(_offset)

    // Rotation: camera orientation + natural hold pose + recoil
    _euler.set(
      -0.042 - spring.current.pos * 2.4,  // X: barrel kick up on recoil
       0.13,                               // Y: slight right tilt (natural grip)
       0.0
    )
    _localQ.setFromEuler(_euler)
    groupRef.current.quaternion.multiplyQuaternions(camera.quaternion, _localQ)

    groupRef.current.visible = active
  })

  return (
    <group ref={groupRef}>

      {/* ── Slide (top receiver) ─────────────────── */}
      <mesh position={[0, 0.019, -0.010]}>
        <boxGeometry args={[0.044, 0.047, 0.212]} />
        <M m="slide" />
      </mesh>

      {/* Slide top flat ridge */}
      <mesh position={[0, 0.044, 0.000]}>
        <boxGeometry args={[0.033, 0.005, 0.197]} />
        <meshStandardMaterial color="#111316" roughness={0.13} metalness={0.97} />
      </mesh>

      {/* Ejection port (cut-out illusion on right side) */}
      <mesh position={[0.023, 0.022, -0.010]}>
        <boxGeometry args={[0.002, 0.020, 0.060]} />
        <meshStandardMaterial color="#0a0b0d" roughness={0.1} metalness={0.95} />
      </mesh>

      {/* ── Frame (lower receiver) ─────────────── */}
      <mesh position={[0, -0.005, 0.012]}>
        <boxGeometry args={[0.042, 0.030, 0.168]} />
        <M m="frame" />
      </mesh>

      {/* Frame rail (bottom, Picatinny-style hint) */}
      <mesh position={[0, -0.021, -0.018]}>
        <boxGeometry args={[0.028, 0.006, 0.100]} />
        <meshStandardMaterial color="#1a1d21" roughness={0.35} metalness={0.75} />
      </mesh>

      {/* ── Barrel ──────────────────────────────── */}
      <mesh position={[0, 0.013, -0.132]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.0072, 0.0072, 0.054, 18]} />
        <M m="barrel" />
      </mesh>

      {/* Muzzle crown */}
      <mesh position={[0, 0.013, -0.160]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.0098, 0.0098, 0.008, 18]} />
        <meshStandardMaterial color="#070809" roughness={0.04} metalness={1.0} />
      </mesh>

      {/* ── Grip ────────────────────────────────── */}
      <mesh position={[0, -0.056, 0.056]} rotation={[0.14, 0, 0]}>
        <boxGeometry args={[0.038, 0.084, 0.042]} />
        <M m="grip" />
      </mesh>

      {/* Grip side panels (slightly lighter) */}
      {[-1, 1].map((side) => (
        <mesh key={side} position={[side * 0.021, -0.054, 0.055]} rotation={[0.14, 0, 0]}>
          <boxGeometry args={[0.002, 0.078, 0.038]} />
          <meshStandardMaterial color="#222428" roughness={0.70} metalness={0.25} />
        </mesh>
      ))}

      {/* Grip texture grooves */}
      {[-0.018, -0.006, 0.006, 0.018, 0.030].map((dz, i) => (
        <mesh key={i} position={[0.021, -0.052, 0.048 + dz]} rotation={[0.14, 0, 0]}>
          <boxGeometry args={[0.002, 0.052, 0.003]} />
          <M m="serrate" />
        </mesh>
      ))}

      {/* ── Trigger guard ───────────────────────── */}
      <mesh position={[0, -0.022, 0.018]}>
        <boxGeometry args={[0.033, 0.009, 0.060]} />
        <M m="guard" />
      </mesh>
      {/* Guard front curve (box approximation) */}
      <mesh position={[0, -0.026, -0.012]}>
        <boxGeometry args={[0.031, 0.007, 0.016]} />
        <M m="guard" />
      </mesh>

      {/* ── Trigger ─────────────────────────────── */}
      <mesh position={[0, -0.028, 0.007]}>
        <boxGeometry args={[0.004, 0.017, 0.007]} />
        <meshStandardMaterial color="#141618" roughness={0.28} metalness={0.72} />
      </mesh>

      {/* ── Front sight ─────────────────────────── */}
      <mesh position={[0, 0.048, -0.096]}>
        <boxGeometry args={[0.003, 0.008, 0.004]} />
        <M m="sight" />
      </mesh>

      {/* ── Rear sight ──────────────────────────── */}
      <mesh position={[0, 0.048, 0.082]}>
        <boxGeometry args={[0.022, 0.008, 0.007]} />
        <M m="sight" />
      </mesh>
      {/* Rear sight center notch */}
      <mesh position={[0, 0.048, 0.082]}>
        <boxGeometry args={[0.007, 0.005, 0.008]} />
        <meshStandardMaterial color="#1a1c20" roughness={0.2} metalness={0.88} />
      </mesh>

      {/* ── Slide serrations (rear, 5 grooves) ─── */}
      {[0.040, 0.054, 0.068, 0.082, 0.093].map((z, i) => (
        <mesh key={i} position={[0.024, 0.018, z]}>
          <boxGeometry args={[0.002, 0.033, 0.004]} />
          <M m="serrate" />
        </mesh>
      ))}

      {/* ── Magazine base plate ─────────────────── */}
      <mesh position={[0, -0.099, 0.053]}>
        <boxGeometry args={[0.036, 0.009, 0.040]} />
        <M m="mag" />
      </mesh>

      {/* ── Muzzle flash ────────────────────────── */}
      <mesh ref={muzzleRef} position={[0, 0.013, -0.165]} visible={false}>
        <sphereGeometry args={[0.024, 8, 8]} />
        <meshBasicMaterial color="#ffdd33" transparent opacity={0.92} />
      </mesh>
      <pointLight
        ref={flashLightRef}
        position={[0, 0.013, -0.165]}
        color="#ff8800"
        intensity={0}
        distance={1.4}
        decay={2}
      />

    </group>
  )
}
