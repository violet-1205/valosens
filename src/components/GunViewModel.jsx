import { useRef, useEffect } from 'react'
import { useThree, useFrame } from '@react-three/fiber'
import { useGLTF, useAnimations } from '@react-three/drei'
import * as THREE from 'three'

const _offset = new THREE.Vector3()
const _euler  = new THREE.Euler(0, 0, 0, 'YXZ')
const _localQ = new THREE.Quaternion()

const MODEL_PATH = '/mark_23__animated_free.glb'
const flashMat   = new THREE.MeshBasicMaterial({ color: '#ffdd33', transparent: true, opacity: 0.92 })

// scale=0.012 기준 센터 보정값
// center y=138.827 → -138.827*0.012 = -1.666
// center z=-10.562 → +10.562*0.012 = 0.127
const SCALE    = 0.012
const OFFSET_Y = -(138.827 * SCALE)   // -1.666
const OFFSET_Z =  (10.562  * SCALE)   //  0.127

export default function GunViewModel({ active = true }) {
  const groupRef      = useRef()
  const muzzleRef     = useRef()
  const flashLightRef = useRef()
  const spring        = useRef({ pos: 0, vel: 0 })
  const flashTimer    = useRef(0)
  const { camera }    = useThree()

  const { scene, animations } = useGLTF(MODEL_PATH)
  const { actions }           = useAnimations(animations, groupRef)

  // Draw 스킵 — 마지막 프레임으로 즉시 점프 (총이 바로 들려있는 상태)
  useEffect(() => {
    if (!actions.Draw) return
    const a = actions.Draw
    a.reset().setLoop(THREE.LoopOnce, 1).play()
    a.clampWhenFinished = true
    // 마지막 프레임으로 즉시 이동
    a.time = a._clip.duration
  }, [actions])

  // 발사 — 즉시 반응, 연사 가능
  useEffect(() => {
    const onDown = () => {
      if (!active || !actions.Shoot) return

      spring.current.vel = 0.07
      flashTimer.current = 0.12

      // 진행 중이던 Shoot 애니메이션 즉시 리셋 후 재생
      actions.Shoot
        .reset()
        .setLoop(THREE.LoopOnce, 1)
        .play()
      actions.Shoot.clampWhenFinished = true
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

    flashTimer.current = Math.max(0, flashTimer.current - dt)
    const ft = flashTimer.current / 0.12
    if (muzzleRef.current) {
      muzzleRef.current.visible = ft > 0.05
      muzzleRef.current.scale.setScalar(ft * 0.9 + 0.1)
    }
    if (flashLightRef.current) flashLightRef.current.intensity = ft * 3.0

    _offset.set(0.25, -0.20, -0.42)
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
      <mesh ref={muzzleRef} position={[0, 0.02, -0.25]} visible={false} material={flashMat}>
        <sphereGeometry args={[0.03, 8, 8]} />
      </mesh>
      <pointLight
        ref={flashLightRef}
        position={[0, 0.02, -0.25]}
        color="#ff9900"
        intensity={0}
        distance={1.5}
        decay={2}
      />
    </group>
  )
}

useGLTF.preload(MODEL_PATH)
