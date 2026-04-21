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

function goToDrawPose(actions) {
  const draw = actions.Draw
  if (!draw) return
  draw.stop()
  draw.reset()
  draw.setLoop(THREE.LoopOnce, 1)
  draw.clampWhenFinished = true
  draw.play()
  draw.time = draw._clip.duration
  draw.paused = true
}

export default function GunViewModel({ active = true }) {
  const groupRef     = useRef()
  const spring       = useRef({ pos: 0, vel: 0 })
  const shootTimeout = useRef(null)
  const initDone     = useRef(false)
  const { camera }   = useThree()

  const { scene, animations } = useGLTF(MODEL_PATH)
  const { actions, mixer }    = useAnimations(animations, groupRef)

  useEffect(() => { initDone.current = false }, [actions])

  useEffect(() => {
    const onDown = () => {
      if (!active || !actions.Shoot) return

      spring.current.vel = 0.07

      if (shootTimeout.current) {
        clearTimeout(shootTimeout.current)
        shootTimeout.current = null
      }

      // Draw 완전 정지 → Shoot 단독 재생 (블렌딩 없음)
      if (actions.Draw) actions.Draw.stop()

      actions.Shoot.stop()
      actions.Shoot.reset()
      actions.Shoot.setLoop(THREE.LoopOnce, 1)
      actions.Shoot.clampWhenFinished = false
      actions.Shoot.play()

      // Shoot 끝나면 Draw 포즈로 복귀
      const duration = (actions.Shoot._clip?.duration ?? 0.35) * 1000
      shootTimeout.current = setTimeout(() => {
        actions.Shoot.stop()
        goToDrawPose(actions)
        shootTimeout.current = null
      }, Math.max(duration, 80))
    }

    window.addEventListener('mousedown', onDown)
    return () => {
      window.removeEventListener('mousedown', onDown)
      if (shootTimeout.current) clearTimeout(shootTimeout.current)
    }
  }, [active, actions])

  useFrame((_, dt) => {
    if (!groupRef.current) return

    // 첫 tick: Draw 마지막 프레임으로 초기화
    if (!initDone.current && actions.Draw && mixer) {
      goToDrawPose(actions)
      mixer.update(0)
      initDone.current = true
    }

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
        object={scene}
        scale={SCALE}
        rotation={[0, Math.PI, 0]}
        position={[0, OFFSET_Y, OFFSET_Z]}
      />
    </group>
  )
}

useGLTF.preload(MODEL_PATH)
