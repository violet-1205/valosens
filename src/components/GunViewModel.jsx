/* @refresh reset */
import { useRef, useEffect, useMemo } from 'react'
import { useThree, useFrame } from '@react-three/fiber'
import { useGLTF, useAnimations } from '@react-three/drei'
import * as THREE from 'three'

// ─── 위치 · 크기 조정 상수 ────────────────────────────────────
//
//  VIEW_OFFSET  — 카메라 기준 총기 위치
//    x: 양수 → 오른쪽,   음수 → 왼쪽
//    y: 양수 → 위,       음수 → 아래  (내리면 손이 화면 밖으로)
//    z: 음수 → 앞(가까이),  (너무 크면 카메라 안으로 들어감)
//
//  MESH_SCALE   — 총기 전체 크기 (클수록 커짐)
//
//  MESH_ROT     — 총기 회전 [X, Y, Z] 라디안
//    Y에 Math.PI 더하면 총구가 앞을 향함
//    Y의 추가값으로 좌우 각도 조절
//    X로 총구 위아래 기울기 조절
//
//  MESH_POS     — 메시 자체 오프셋 (그룹 기준, 미세 조정용)
//
// ─────────────────────────────────────────────────────────────
const VIEW_OFFSET = new THREE.Vector3(0.22, -0.22, -0.45)  // 오른쪽·아래·앞
const MESH_SCALE  = 0.13                                    // 크기
const MESH_ROT    = [0.05, Math.PI + 0.30, -0.02]          // [X기울기, Y방향, Z틸트]
const MESH_POS    = [0.0, -0.05, 0.0]                      // 미세 위치 오프셋
// ─────────────────────────────────────────────────────────────

const _offset = new THREE.Vector3()
const _euler  = new THREE.Euler(0, 0, 0, 'YXZ')
const _localQ = new THREE.Quaternion()
const LOCAL_TILT = new THREE.Euler(-0.04, 0.06, -0.02, 'YXZ')

// 블로우백 스프링 파라미터
const RECOIL_KICK     = 0.14   // 발사 시 초기 반동 강도 (클수록 세게 튐)
const RECOIL_STIFF    = 26     // 복원 강도 (클수록 빠르게 원위치)
const RECOIL_DAMPING  = 11     // 감쇠 (클수록 진동 없이 멈춤)
const RECOIL_PITCH    = 2.2    // 반동 시 총구 들림 각도 배율

const MODEL_PATH = '/fps_animations_vsk.glb'

export default function GunViewModel({ active = true }) {
  const groupRef   = useRef()
  const sceneRef   = useRef()
  const spring     = useRef({ pos: 0, vel: 0 })
  const { camera } = useThree()

  const { scene, animations } = useGLTF(MODEL_PATH)
  const modelScene = useMemo(() => scene.clone(true), [scene])
  const { actions, names } = useAnimations(animations, sceneRef)

  useEffect(() => {
    modelScene.traverse(obj => {
      if (obj.isMesh) obj.frustumCulled = false
    })
  }, [modelScene])

  // 마운트 시 Idle 루프
  useEffect(() => {
    if (!names.length) return
    const idleName = names.find(n => /idle/i.test(n))
    if (idleName && actions[idleName]) {
      actions[idleName].setLoop(THREE.LoopRepeat, Infinity)
      actions[idleName].play()
    }
  }, [actions, names])

  // 클릭 → Fire 1회 → Idle 복귀 + 블로우백
  useEffect(() => {
    if (!names.length) return
    const fireName = names.find(n => /fire/i.test(n)) ?? names[0]
    const idleName = names.find(n => /idle/i.test(n))

    const onDown = () => {
      if (!active) return

      // 블로우백 킥
      spring.current.vel = RECOIL_KICK

      if (!actions[fireName]) return
      if (idleName && actions[idleName]) actions[idleName].stop()

      const action = actions[fireName]
      action.stop().reset()
      action.setLoop(THREE.LoopOnce, 1)
      action.clampWhenFinished = false
      action.play()

      const mixer = action.getMixer()
      const onFinished = (e) => {
        if (e.action !== action) return
        mixer.removeEventListener('finished', onFinished)
        if (idleName && actions[idleName]) {
          actions[idleName].reset()
          actions[idleName].setLoop(THREE.LoopRepeat, Infinity)
          actions[idleName].play()
        }
      }
      mixer.addEventListener('finished', onFinished)
    }

    window.addEventListener('mousedown', onDown)
    return () => window.removeEventListener('mousedown', onDown)
  }, [active, actions, names])

  useFrame((_, dt) => {
    if (!groupRef.current) return

    // 스프링 물리
    const s = spring.current
    s.vel += (-s.pos * RECOIL_STIFF - s.vel * RECOIL_DAMPING) * dt
    s.pos += s.vel * dt
    const recoil = s.pos

    // 카메라를 따라가는 위치
    _offset.copy(VIEW_OFFSET)
    _offset.applyQuaternion(camera.quaternion)
    _offset.add(camera.position)
    groupRef.current.position.copy(_offset)

    // 카메라 회전 + 반동 피치
    _euler.set(LOCAL_TILT.x - recoil * RECOIL_PITCH, LOCAL_TILT.y, LOCAL_TILT.z)
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
