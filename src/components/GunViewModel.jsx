import { useRef, useEffect, useMemo } from 'react'
import { useThree, useFrame } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'

const _offset = new THREE.Vector3()
const _euler  = new THREE.Euler(0, 0, 0, 'YXZ')
const _localQ = new THREE.Quaternion()

const MODEL_PATH = '/Revolver.glb'

const flashMat = new THREE.MeshBasicMaterial({ color: '#ffdd33', transparent: true, opacity: 0.92 })

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


    </group>
  )
}

useGLTF.preload(MODEL_PATH)
