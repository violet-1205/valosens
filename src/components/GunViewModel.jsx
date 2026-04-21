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
  const groupRef       = useRef()
  const spring         = useRef({ pos: 0, vel: 0 })
  const shootTimeout   = useRef(null)
  const initDone       = useRef(false)
  const { camera }     = useThree()

  const { scene, animations } = useGLTF(MODEL_PATH)
  const { actions, mixer }    = useAnimations(animations, groupRef)

  // 초기화: Draw 마지막 프레임에서 정지 (총 들고 있는 자세)
  // useFrame 첫 번째 tick에서 처리해야 mixer가 pose 반영
  useEffect(() => {
    initDone.current = false
  }, [actions])

  // 발사
  useEffect(() => {
    const onDown = () => {
      if (!active || !actions.Shoot) return

      spring.current.vel = 0.07

      // 진행 중 복귀 타이머 취소
      if (shootTimeout.current) {
        clearTimeout(shootTimeout.current)
        shootTimeout.current = null
      }

      // Shoot 즉시 재생
      actions.Shoot.reset().setLoop(THREE.LoopOnce, 1).play()
      actions.Shoot.clampWhenFinished = false

      // Shoot 끝나면 Draw 마지막 프레임(들고있는 자세)으로 복귀
      const duration = (actions.Shoot._clip?.duration ?? 0.35) * 1000
      shootTimeout.current = setTimeout(() => {
        if (!actions.Draw) return
        actions.Shoot.stop()
        const draw = actions.Draw
        draw.reset().setLoop(THREE.LoopOnce, 1).play()
        draw.clampWhenFinished = true
        // 다음 프레임에 마지막 시간으로 점프
        requestAnimationFrame(() => {
          draw.time = draw._clip.duration
          draw.paused = true
        })
        shootTimeout.current = null
      }, Math.max(duration * 0.85, 80))
    }

    window.addEventListener('mousedown', onDown)
    return () => {
      window.removeEventListener('mousedown', onDown)
      if (shootTimeout.current) clearTimeout(shootTimeout.current)
    }
  }, [active, actions])

  useFrame((_, dt) => {
    if (!groupRef.current) return

    // 첫 tick에 Draw 마지막 프레임으로 고정
    if (!initDone.current && actions.Draw) {
      const draw = actions.Draw
      draw.reset().setLoop(THREE.LoopOnce, 1).play()
      draw.clampWhenFinished = true
      draw.time = draw._clip.duration
      draw.paused = true
      mixer.update(0)  // 즉시 pose 반영
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
