import { useRef, useEffect, useMemo } from 'react'
import { useThree, useFrame } from '@react-three/fiber'
import { useGLTF, useAnimations } from '@react-three/drei'
import * as THREE from 'three'

const _offset = new THREE.Vector3()
const _euler  = new THREE.Euler(0, 0, 0, 'YXZ')
const _localQ = new THREE.Quaternion()

const MODEL_PATH = '/mark_23__animated_free.glb'

const flashMat = new THREE.MeshBasicMaterial({ color: '#ffdd33', transparent: true, opacity: 0.92 })

export default function GunViewModel({ active = true }) {
  const groupRef      = useRef()
  const muzzleRef     = useRef()
  const flashLightRef = useRef()
  const spring        = useRef({ pos: 0, vel: 0 })
  const flashTimer    = useRef(0)
  const isFiring      = useRef(false)
  const { camera }    = useThree()

  const { scene, animations } = useGLTF(MODEL_PATH)
  const { actions, names }    = useAnimations(animations, groupRef)

  const model = useMemo(() => {
    const clone = scene.clone(true)
    clone.traverse((node) => {
      if (node.isMesh) {
        node.frustumCulled = false
        node.castShadow    = false
        node.receiveShadow = false
        if (node.material) {
          node.material = node.material.clone()
          node.material.envMapIntensity = 1.4
        }
      }
    })
    return clone
  }, [scene])

  // 사용 가능한 애니메이션 이름 콘솔 출력 (튜닝용)
  useEffect(() => {
    console.log('[GunViewModel] 애니메이션 목록:', names)
  }, [names])

  // Idle 애니메이션 재생
  useEffect(() => {
    if (!names.length) return
    // 이름에 'idle' 포함된 것 우선, 없으면 첫 번째
    const idleName = names.find(n => /idle/i.test(n)) ?? names[0]
    actions[idleName]?.reset().fadeIn(0.3).play()
    return () => actions[idleName]?.fadeOut(0.2)
  }, [actions, names])

  // 발사 이벤트
  useEffect(() => {
    const onDown = () => {
      if (!active) return
      spring.current.vel = 0.07
      flashTimer.current = 0.12

      // Fire 애니메이션 재생 (이름에 fire/shoot/recoil 포함된 것)
      const fireName = names.find(n => /fire|shoot|recoil|attack/i.test(n))
      const idleName = names.find(n => /idle/i.test(n)) ?? names[0]
      if (fireName && actions[fireName]) {
        isFiring.current = true
        actions[fireName]
          .reset()
          .setLoop(THREE.LoopOnce, 1)
          .fadeIn(0.05)
          .play()
        actions[fireName].clampWhenFinished = true

        // 발사 애니메이션 끝나면 Idle로 복귀
        const duration = actions[fireName]._clip.duration * 1000
        setTimeout(() => {
          if (!isFiring.current) return
          isFiring.current = false
          actions[fireName]?.fadeOut(0.1)
          if (idleName) actions[idleName]?.reset().fadeIn(0.15).play()
        }, duration)
      }
    }
    window.addEventListener('mousedown', onDown)
    return () => window.removeEventListener('mousedown', onDown)
  }, [active, actions, names])

  useFrame((_, dt) => {
    if (!groupRef.current) return

    // 스프링 반동
    const { pos, vel } = spring.current
    spring.current.vel = vel + (-pos * 24 - vel * 10) * dt
    spring.current.pos = pos + spring.current.vel * dt
    const recoil = spring.current.pos

    // 총구 화염
    flashTimer.current = Math.max(0, flashTimer.current - dt)
    const ft = flashTimer.current / 0.12
    if (muzzleRef.current) {
      muzzleRef.current.visible = ft > 0.05
      muzzleRef.current.scale.setScalar(ft * 0.9 + 0.1)
    }
    if (flashLightRef.current) flashLightRef.current.intensity = ft * 3.0

    // 화면 우하단 고정
    _offset.set(0.28, -0.22, -0.50)
    _offset.applyQuaternion(camera.quaternion)
    _offset.add(camera.position)
    groupRef.current.position.copy(_offset)

    // 카메라 방향 + 반동
    _euler.set(-0.05 - recoil * 2.8, 0.10, -0.04)
    _localQ.setFromEuler(_euler)
    groupRef.current.quaternion.multiplyQuaternions(camera.quaternion, _localQ)

    groupRef.current.visible = active
  })

  return (
    <group ref={groupRef}>
      <primitive
        object={model}
        scale={0.08}
        rotation={[0, Math.PI, 0]}
        position={[0, 0, 0]}
      />

      {/* 총구 화염 */}
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
