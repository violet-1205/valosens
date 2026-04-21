import { useRef, useEffect } from 'react'
import { useThree, useFrame } from '@react-three/fiber'
import { useGLTF, useAnimations } from '@react-three/drei'
import * as THREE from 'three'

const _offset = new THREE.Vector3()
const _euler  = new THREE.Euler(0, 0, 0, 'YXZ')
const _localQ = new THREE.Quaternion()

const MODEL_PATH = '/animated_pistol.glb'

export default function GunViewModel({ active = true }) {
  const groupRef   = useRef()
  const sceneRef   = useRef()
  const spring     = useRef({ pos: 0, vel: 0 })
  const { camera } = useThree()

  const { scene, animations } = useGLTF(MODEL_PATH)
  const { actions, names }    = useAnimations(animations, sceneRef)

  // 애니메이션 이름 확인
  useEffect(() => {
    if (names.length) console.log('[Gun] 애니메이션:', names)
  }, [names])

  // 발사 애니메이션만 — reload/draw/hide 제외
  useEffect(() => {
    if (!names.length) return
    const fireName = names.find(n => /fire|shoot|recoil|attack|pistol|shoot/i.test(n))
                  ?? names.find(n => !/reload|draw|hide|idle/i.test(n))
                  ?? names[0]

    const onDown = () => {
      if (!active || !actions[fireName]) return
      spring.current.vel = 0.08
      actions[fireName].reset().setLoop(THREE.LoopOnce, 1).play()
      actions[fireName].clampWhenFinished = true
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
    _offset.set(0.32, -0.28, -0.45)
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
      <primitive
        ref={sceneRef}
        object={scene}
        scale={0.45}
        rotation={[0, Math.PI, 0]}
        position={[0, 0, 0]}
      />
    </group>
  )
}

useGLTF.preload(MODEL_PATH)
