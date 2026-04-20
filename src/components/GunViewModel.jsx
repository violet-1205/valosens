import { useRef, useEffect, useMemo } from 'react'
import { useThree, useFrame } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'

const _offset = new THREE.Vector3()
const _euler  = new THREE.Euler(0, 0, 0, 'YXZ')
const _localQ = new THREE.Quaternion()

const MODEL_PATH = '/Revolver.glb'

const skinMat     = new THREE.MeshStandardMaterial({ color: '#b87754', roughness: 0.70, metalness: 0.00 })
const skinDarkMat = new THREE.MeshStandardMaterial({ color: '#9a6040', roughness: 0.75, metalness: 0.00 })
const nailMat     = new THREE.MeshStandardMaterial({ color: '#d4a882', roughness: 0.50, metalness: 0.00 })
const sleeveMat   = new THREE.MeshStandardMaterial({ color: '#1a1a2e', roughness: 0.90, metalness: 0.00 })
const flashMat    = new THREE.MeshBasicMaterial({ color: '#ffdd33', transparent: true, opacity: 0.92 })

export default function GunViewModel({ active = true }) {
  const groupRef      = useRef()
  const muzzleRef     = useRef()
  const flashLightRef = useRef()
  const spring        = useRef({ pos: 0, vel: 0 })
  const flashTimer    = useRef(0)
  const { camera }    = useThree()

  const { scene } = useGLTF(MODEL_PATH)
  const model = useMemo(() => {
    const clone = scene.clone(true)
    clone.traverse((node) => {
      if (node.isMesh) {
        node.frustumCulled = false
        node.castShadow = false
        node.receiveShadow = false
        if (node.material) {
          node.material = node.material.clone()
          node.material.envMapIntensity = 1.2
        }
      }
    })
    return clone
  }, [scene])

  useEffect(() => {
    const onDown = () => {
      if (!active) return
      spring.current.vel = 0.07
      flashTimer.current = 0.10
    }
    window.addEventListener('mousedown', onDown)
    return () => window.removeEventListener('mousedown', onDown)
  }, [active])

  useFrame((_, dt) => {
    if (!groupRef.current) return

    const { pos, vel } = spring.current
    spring.current.vel = vel + (-pos * 24 - vel * 10) * dt
    spring.current.pos = pos + spring.current.vel * dt
    const recoil = spring.current.pos

    flashTimer.current = Math.max(0, flashTimer.current - dt)
    const ft = flashTimer.current / 0.10
    if (muzzleRef.current) {
      muzzleRef.current.visible = ft > 0.05
      muzzleRef.current.scale.setScalar(ft * 0.9 + 0.1)
    }
    if (flashLightRef.current) flashLightRef.current.intensity = ft * 2.5

    _offset.set(0.28, -0.22, -0.50)
    _offset.applyQuaternion(camera.quaternion)
    _offset.add(camera.position)
    groupRef.current.position.copy(_offset)

    _euler.set(-0.05 - recoil * 2.8, 0.10, -0.04)
    _localQ.setFromEuler(_euler)
    groupRef.current.quaternion.multiplyQuaternions(camera.quaternion, _localQ)

    groupRef.current.visible = active
  })

  return (
    <group ref={groupRef}>

      {/* Gun model — grip is at bottom-back, so offset gun up so grip meets hand */}
      <primitive
        object={model}
        scale={0.10}
        rotation={[0, Math.PI, 0]}
        position={[0, 0.02, 0]}
      />

      {/* Muzzle flash */}
      <mesh ref={muzzleRef} position={[0, 0.04, -0.22]} visible={false} material={flashMat}>
        <sphereGeometry args={[0.035, 8, 8]} />
      </mesh>
      <pointLight
        ref={flashLightRef}
        position={[0, 0.04, -0.22]}
        color="#ff9900"
        intensity={0}
        distance={1.8}
        decay={2}
      />

      {/* ── HAND ─────────────────────────────────────────────────────
          Sized to match the revolver grip.
          Palm dimensions tuned to grip width of the model.
      ──────────────────────────────────────────────────────────── */}
      <group position={[0, -0.038, 0.068]}>

        {/* Palm */}
        <mesh material={skinMat} rotation={[-0.18, 0, 0]}>
          <boxGeometry args={[0.050, 0.065, 0.050]} />
        </mesh>
        {/* Knuckle ridge */}
        <mesh material={skinDarkMat} position={[0, 0.034, -0.022]} rotation={[0.25, 0, 0]}>
          <boxGeometry args={[0.048, 0.013, 0.018]} />
        </mesh>

        {/* Index — slightly extended toward trigger */}
        <group position={[-0.014, 0.036, -0.030]} rotation={[-0.78, 0, 0.05]}>
          <mesh material={skinMat}><capsuleGeometry args={[0.007, 0.022, 4, 8]} /></mesh>
          <mesh material={skinMat} position={[0, 0.028, 0]} rotation={[0.35, 0, 0]}>
            <capsuleGeometry args={[0.006, 0.017, 4, 8]} />
          </mesh>
          <mesh material={nailMat} position={[0, 0.042, -0.007]} rotation={[0.55, 0, 0]}>
            <boxGeometry args={[0.010, 0.005, 0.013]} />
          </mesh>
        </group>

        {/* Middle — tight grip */}
        <group position={[-0.001, 0.038, -0.032]} rotation={[-1.10, 0, 0]}>
          <mesh material={skinMat}><capsuleGeometry args={[0.008, 0.026, 4, 8]} /></mesh>
          <mesh material={skinMat} position={[0, 0.032, 0]} rotation={[0.35, 0, 0]}>
            <capsuleGeometry args={[0.007, 0.019, 4, 8]} />
          </mesh>
          <mesh material={nailMat} position={[0, 0.047, -0.007]} rotation={[0.55, 0, 0]}>
            <boxGeometry args={[0.011, 0.005, 0.013]} />
          </mesh>
        </group>

        {/* Ring — tight grip */}
        <group position={[0.013, 0.034, -0.029]} rotation={[-1.05, 0, -0.04]}>
          <mesh material={skinMat}><capsuleGeometry args={[0.007, 0.022, 4, 8]} /></mesh>
          <mesh material={skinMat} position={[0, 0.028, 0]} rotation={[0.35, 0, 0]}>
            <capsuleGeometry args={[0.006, 0.017, 4, 8]} />
          </mesh>
          <mesh material={nailMat} position={[0, 0.041, -0.007]} rotation={[0.55, 0, 0]}>
            <boxGeometry args={[0.010, 0.005, 0.012]} />
          </mesh>
        </group>

        {/* Pinky */}
        <group position={[0.025, 0.022, -0.024]} rotation={[-0.95, 0, -0.13]}>
          <mesh material={skinMat}><capsuleGeometry args={[0.006, 0.017, 4, 8]} /></mesh>
          <mesh material={skinMat} position={[0, 0.022, 0]} rotation={[0.35, 0, 0]}>
            <capsuleGeometry args={[0.005, 0.013, 4, 8]} />
          </mesh>
          <mesh material={nailMat} position={[0, 0.032, -0.006]} rotation={[0.55, 0, 0]}>
            <boxGeometry args={[0.008, 0.004, 0.010]} />
          </mesh>
        </group>

        {/* Thumb — resting on left side of grip */}
        <group position={[-0.032, 0.004, -0.006]} rotation={[0.08, 0.14, -0.80]}>
          <mesh material={skinMat}><capsuleGeometry args={[0.009, 0.022, 4, 8]} /></mesh>
          <mesh material={skinMat} position={[0, 0.028, 0]} rotation={[-0.18, 0, 0]}>
            <capsuleGeometry args={[0.008, 0.017, 4, 8]} />
          </mesh>
          <mesh material={nailMat} position={[0, 0.041, -0.008]} rotation={[0.60, 0, 0]}>
            <boxGeometry args={[0.012, 0.005, 0.014]} />
          </mesh>
        </group>

        {/* Wrist */}
        <mesh material={skinMat} position={[0, -0.006, 0.050]} rotation={[-0.18, 0, 0]}>
          <cylinderGeometry args={[0.024, 0.028, 0.075, 12]} />
        </mesh>
        {/* Wrist crease */}
        <mesh material={skinDarkMat} position={[0, -0.005, 0.035]} rotation={[-0.18, 0, 0]}>
          <torusGeometry args={[0.025, 0.002, 4, 14]} />
        </mesh>

        {/* Sleeve cuff */}
        <mesh material={sleeveMat} position={[0, -0.005, 0.090]} rotation={[-0.18, 0, 0]}>
          <cylinderGeometry args={[0.032, 0.034, 0.024, 12]} />
        </mesh>

      </group>

    </group>
  )
}

useGLTF.preload(MODEL_PATH)
