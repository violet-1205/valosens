import { useRef, useEffect } from 'react'
import { useThree, useFrame } from '@react-three/fiber'
import { useGLTF, useAnimations } from '@react-three/drei'
import * as THREE from 'three'

const _offset = new THREE.Vector3()
const _euler  = new THREE.Euler(0, 0, 0, 'YXZ')
const _localQ = new THREE.Quaternion()

const MODEL_PATH = '/mark_23__animated_free.glb'

const SCALE    = 0.0096
const OFFSET_Y = -(138.827 * SCALE)
const OFFSET_Z =  (10.562  * SCALE)

export default function GunViewModel({ active = true }) {
  const groupRef   = useRef()
  const sceneRef   = useRef()        // scene 직접 참조 → mixer root로 사용
  const spring     = useRef({ pos: 0, vel: 0 })
  const { camera } = useThree()

  const { scene, animations } = useGLTF(MODEL_PATH)

  // mixer root = scene (bone이 실제로 있는 곳)
  const { actions } = useAnimations(animations, sceneRef)

  // 마운트 시 Shoot 애니메이션 frame 0에서 대기
  useEffect(() => {
    if (!actions?.Shoot) return
    actions.Shoot.reset()
    actions.Shoot.setLoop(THREE.LoopOnce, 1)
    actions.Shoot.clampWhenFinished = true
    actions.Shoot.play()
    actions.Shoot.paused = true   // frame 0에서 정지 (총 들고 있는 자세)
  }, [actions])

  // 클릭 → Shoot 재생
  useEffect(() => {
    const onDown = () => {
      if (!active || !actions?.Shoot) return
      spring.current.vel = 0.07
      actions.Shoot.paused = false   // 그냥 재생 재개 (reset 없이)
      actions.Shoot.reset().play()   // 연속 클릭 시 처음부터 재생
    }
    window.addEventListener('mousedown', onDown)
    return () => window.removeEventListener('mousedown', onDown)
  }, [active, actions])

  useFrame((_, dt) => {
    if (!groupRef.current) return

    const { pos, vel } = spring.current
    spring.current.vel = vel + (-pos * 24 - vel * 10) * dt
    spring.current.pos = pos + spring.current.vel * dt
    const recoil = spring.current.pos

    _offset.set(0.12, -0.20, -0.42)
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
        scale={SCALE}
        rotation={[0, Math.PI, 0]}
        position={[0, OFFSET_Y, OFFSET_Z]}
      />
    </group>
  )
}

useGLTF.preload(MODEL_PATH)
