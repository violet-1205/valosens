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
  const initDone   = useRef(false)
  const { camera } = useThree()

  const { scene, animations } = useGLTF(MODEL_PATH)
  const { actions, names }    = useAnimations(animations, sceneRef)

  // 모델 사이즈 & 애니메이션 이름 확인용
  useEffect(() => {
    const box = new THREE.Box3().setFromObject(scene)
    const size = new THREE.Vector3()
    const center = new THREE.Vector3()
    box.getSize(size)
    box.getCenter(center)
    console.log(`[Gun] 사이즈 x:${size.x.toFixed(3)} y:${size.y.toFixed(3)} z:${size.z.toFixed(3)}`)
    console.log(`[Gun] 센터  x:${center.x.toFixed(3)} y:${center.y.toFixed(3)} z:${center.z.toFixed(3)}`)
    console.log('[Gun] 애니메이션:', names)
  }, [scene, names])

  // 클릭 → 발사 애니메이션
  useEffect(() => {
    const onDown = () => {
      if (!active) return
      spring.current.vel = 0.07

      // fire/shoot 계열 애니메이션 찾기
      const fireName = names.find(n => /fire|shoot|recoil|attack|action/i.test(n)) ?? names[0]
      if (!fireName || !actions[fireName]) return

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
        scale={1}
        rotation={[0, Math.PI, 0]}
        position={[0, 0, 0]}
      />
    </group>
  )
}

useGLTF.preload(MODEL_PATH)
