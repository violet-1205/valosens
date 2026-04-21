import { useRef, useEffect } from 'react'
import { useThree, useFrame } from '@react-three/fiber'
import { useGLTF, useAnimations } from '@react-three/drei'
import * as THREE from 'three'

const _offset = new THREE.Vector3()
const _euler  = new THREE.Euler(0, 0, 0, 'YXZ')
const _localQ = new THREE.Quaternion()

const MODEL_PATH = '/pistol_animated.glb'

export default function GunViewModel({ active = true }) {
  const groupRef   = useRef()
  const sceneRef   = useRef()
  const spring     = useRef({ pos: 0, vel: 0 })
  const { camera } = useThree()

  const { scene, animations } = useGLTF(MODEL_PATH)
  const { actions, names }    = useAnimations(animations, sceneRef)

  // Fire 애니메이션만 사용 — Idle/Reload/Hide 재생 안 함
  useEffect(() => {
    if (!names.length) return
    const fireName = names.find(n => /fire/i.test(n)) ?? names[0]

    const onDown = () => {
      if (!active || !actions[fireName]) return
      spring.current.vel = 0.12
      const action = actions[fireName]
      action.stop()
      action.reset()
      action.setLoop(THREE.LoopOnce, 1)
      action.clampWhenFinished = true
      action.play()
    }
    window.addEventListener('mousedown', onDown)
    return () => window.removeEventListener('mousedown', onDown)
  }, [active, actions, names])

  useFrame((_, dt) => {
    if (!groupRef.current) return

    const { pos, vel } = spring.current
    spring.current.vel = vel + (-pos * 24 - vel * 10) * dt
    spring.current.pos = pos + spring.current.vel * dt
    const recoil = spring.current.pos

    // 우하단 고정 — x:오른쪽, y:아래, z:카메라 거리
    _offset.set(0.26, -0.36, -0.38)
    _offset.applyQuaternion(camera.quaternion)
    _offset.add(camera.position)
    groupRef.current.position.copy(_offset)

    _euler.set(-0.08 - recoil * 2.5, 0.08, -0.02)
    _localQ.setFromEuler(_euler)
    groupRef.current.quaternion.multiplyQuaternions(camera.quaternion, _localQ)

    groupRef.current.visible = active
  })

  return (
    <group ref={groupRef}>
      <primitive
        ref={sceneRef}
        object={scene}
        scale={0.22}
        rotation={[0, Math.PI, 0]}
        position={[0, 0, 0]}
      />
    </group>
  )
}

useGLTF.preload(MODEL_PATH)
