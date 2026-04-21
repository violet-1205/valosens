/* @refresh reset */
import { useRef, useEffect, useMemo } from 'react'
import { useThree, useFrame } from '@react-three/fiber'
import { useGLTF, useAnimations } from '@react-three/drei'
import * as THREE from 'three'

const _offset = new THREE.Vector3()
const _euler  = new THREE.Euler(0, 0, 0, 'YXZ')
const _localQ = new THREE.Quaternion()

const MODEL_PATH = '/pistol_animated.glb'

// ── 실측치 (gltf-transform inspect) ──────────────────────────
// bbox Y: -0.285 ~ +0.537  (총 0.822 유닛)
// 메쉬: arm_arms_0 + pistol_pistol_0  (팔+권총만, 풀바디 아님)
// FOV 75° / Z=-0.50 → 화면 절반높이 ≈ 0.384 월드유닛
// scale 0.32 → 모델 높이 0.263 유닛 ≈ 화면 높이의 34%
// ─────────────────────────────────────────────────────────────
const VIEW_OFFSET = new THREE.Vector3(0.20, -0.22, -0.50)
const LOCAL_TILT  = new THREE.Euler(-0.04, 0.06, -0.02, 'YXZ')
const MESH_SCALE  = 0.32
const MESH_ROT    = [0.11, Math.PI + 0.4, -0.035]
// Y 오프셋: 팔 아랫부분 살짝 화면 밖으로 → 자연스러운 FPS 컷오프
const MESH_POS    = [0.0, -0.10, 0.0]

export default function GunViewModel({ active = true }) {
  const groupRef   = useRef()
  const sceneRef   = useRef()
  const spring     = useRef({ pos: 0, vel: 0 })
  const { camera } = useThree()

  const { scene, animations } = useGLTF(MODEL_PATH)
  const modelScene = useMemo(() => scene.clone(true), [scene])
  const { actions, names }    = useAnimations(animations, sceneRef)

  useEffect(() => {
    modelScene.traverse(obj => {
      if (obj.isMesh) obj.frustumCulled = false
    })
  }, [modelScene])

  // Fire 애니메이션만 — Armature|Fire
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

    _offset.copy(VIEW_OFFSET)
    _offset.applyQuaternion(camera.quaternion)
    _offset.add(camera.position)
    groupRef.current.position.copy(_offset)

    _euler.set(LOCAL_TILT.x - recoil * 2.0, LOCAL_TILT.y, LOCAL_TILT.z)
    _localQ.setFromEuler(_euler)
    groupRef.current.quaternion.multiplyQuaternions(camera.quaternion, _localQ)

    groupRef.current.visible = active
  })

  return (
    <group ref={groupRef}>
      <primitive
        ref={sceneRef}
        object={modelScene}
        scale={MESH_SCALE}
        rotation={MESH_ROT}
        position={MESH_POS}
      />
    </group>
  )
}

useGLTF.preload(MODEL_PATH)
