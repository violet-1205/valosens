import { useRef, useEffect } from 'react'
import { useThree, useFrame } from '@react-three/fiber'
import { useGLTF, useAnimations } from '@react-three/drei'
import * as THREE from 'three'

const _offset = new THREE.Vector3()
const _euler  = new THREE.Euler(0, 0, 0, 'YXZ')
const _localQ = new THREE.Quaternion()

const MODEL_PATH = '/mark_23__animated_free.glb'
const flashMat   = new THREE.MeshBasicMaterial({ color: '#ffdd33', transparent: true, opacity: 0.92 })

export default function GunViewModel({ active = true }) {
  const groupRef      = useRef()
  const muzzleRef     = useRef()
  const flashLightRef = useRef()
  const spring        = useRef({ pos: 0, vel: 0 })
  const flashTimer    = useRef(0)
  const canFireRef    = useRef(true)
  const { camera }    = useThree()

  const { scene, animations } = useGLTF(MODEL_PATH)
  const { actions }           = useAnimations(animations, groupRef)

  // 모델 실제 크기 로그 (튜닝용)
  useEffect(() => {
    const box = new THREE.Box3().setFromObject(scene)
    const size = new THREE.Vector3()
    const center = new THREE.Vector3()
    box.getSize(size)
    box.getCenter(center)
    console.log(`[GunViewModel] 사이즈 x:${size.x.toFixed(3)} y:${size.y.toFixed(3)} z:${size.z.toFixed(3)}`)
    console.log(`[GunViewModel] 센터  x:${center.x.toFixed(3)} y:${center.y.toFixed(3)} z:${center.z.toFixed(3)}`)
  }, [scene])

  // Draw 애니메이션으로 시작 (총 꺼내는 모션)
  useEffect(() => {
    if (!actions.Draw) return
    actions.Draw.reset()
      .setLoop(THREE.LoopOnce, 1)
      .fadeIn(0.1)
      .play()
    actions.Draw.clampWhenFinished = true
  }, [actions])

  // 발사: Shoot → 끝나면 멈춤 (마지막 프레임 유지)
  useEffect(() => {
    const onDown = () => {
      if (!active || !canFireRef.current || !actions.Shoot) return
      canFireRef.current = false

      spring.current.vel = 0.07
      flashTimer.current = 0.12

      actions.Shoot.reset()
        .setLoop(THREE.LoopOnce, 1)
        .fadeIn(0.04)
        .play()
      actions.Shoot.clampWhenFinished = true

      const duration = (actions.Shoot._clip?.duration ?? 0.4) * 1000
      setTimeout(() => {
        canFireRef.current = true
      }, Math.max(duration * 0.8, 100))
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

    _offset.set(0.28, -0.22, -0.50)
    _offset.applyQuaternion(camera.quaternion)
    _offset.add(camera.position)
    groupRef.current.position.copy(_offset)

    _euler.set(-0.05 - recoil * 2.8, 0.10, -0.04)
    _localQ.setFromEuler(_euler)
    groupRef.current.quaternion.multiplyQuaternions(camera.quaternion, _localQ)

    groupRef.current.visible = true // DEBUG: 항상 표시
  })

  return (
    <group ref={groupRef}>
      <primitive
        object={scene}
        scale={1.0}
        rotation={[0, Math.PI, 0]}
        position={[0, 0, 0]}
      />
      <mesh ref={muzzleRef} position={[0, 0.02, -0.20]} visible={false} material={flashMat}>
        <sphereGeometry args={[0.03, 8, 8]} />
      </mesh>
      <pointLight
        ref={flashLightRef}
        position={[0, 0.02, -0.20]}
        color="#ff9900"
        intensity={0}
        distance={1.5}
        decay={2}
      />
    </group>
  )
}

useGLTF.preload(MODEL_PATH)
