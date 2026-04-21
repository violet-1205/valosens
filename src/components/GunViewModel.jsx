/* @refresh reset */
// R3F/GLTF 뷰모델은 HMR이 자주 무반응 → 이 파일 수정 시 전체 리로드 유도
import { useRef, useEffect, useMemo } from 'react'
import { useThree, useFrame } from '@react-three/fiber'
import { useGLTF, useAnimations } from '@react-three/drei'
import * as THREE from 'three'

const _offset = new THREE.Vector3()
const _euler  = new THREE.Euler(0, 0, 0, 'YXZ')
const _localQ = new THREE.Quaternion()

// pistol_animated_orig.glb → quantize+webp 압축본 사용 (2.3 MB)
const MODEL_PATH = '/pistol_animated.glb'

// 1인칭 뷰모델: 우하단 · 슬라이드 뒤가 카메라 · 총구는 좌상(레퍼런스 이미지 기준)
const VIEW_OFFSET  = new THREE.Vector3(0.20, -0.20, -0.55)
const LOCAL_TILT   = new THREE.Euler(-0.04, 0.06, -0.02, 'YXZ')
// 모델 로컬 보정 — Y=-1.46 으로 발/몸통 화면 밖, 총+손목만 노출
const MESH_ROT     = [0.11, Math.PI + 0.4, -0.035]
const MESH_POS     = [0.03, -1.46, 0.05]
const MESH_SCALE   = 0.20

export default function GunViewModel({ active = true }) {
  const groupRef   = useRef()
  const sceneRef   = useRef()
  const spring     = useRef({ pos: 0, vel: 0 })
  const { camera } = useThree()

  const { scene, animations } = useGLTF(MODEL_PATH)
  const modelScene = useMemo(() => scene.clone(true), [scene])
  const { actions, names }    = useAnimations(animations, sceneRef)

  // frustum culling 끄기 — 카메라 근거리 모델이 사라지는 현상 방지
  useEffect(() => {
    modelScene.traverse((obj) => {
      if (obj.isMesh) obj.frustumCulled = false
    })
  }, [modelScene])

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

    _offset.copy(VIEW_OFFSET)
    _offset.applyQuaternion(camera.quaternion)
    _offset.add(camera.position)
    groupRef.current.position.copy(_offset)

    _euler.set(
      LOCAL_TILT.x - recoil * 2.0,
      LOCAL_TILT.y,
      LOCAL_TILT.z
    )
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
