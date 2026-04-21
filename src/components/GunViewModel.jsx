/* @refresh reset */
import { useRef, useEffect, useMemo } from 'react'
import { useThree, useFrame } from '@react-three/fiber'
import { useGLTF, useAnimations } from '@react-three/drei'
import * as THREE from 'three'

const _offset = new THREE.Vector3()
const _euler  = new THREE.Euler(0, 0, 0, 'YXZ')
const _localQ = new THREE.Quaternion()

const MODEL_PATH = '/fps_animations_vsk.glb'

// ── 실측치 ────────────────────────────────────────────────────
// bbox XYZ: ±1.0 / ±1.0 / -1.193~+1.279  (총 ~2 유닛)
// 메쉬: Male_04 (팔) + VSK-94 3파트
// 애니메이션: Rig|VSK_Idle / Rig|VSK_Fire 등
// ─────────────────────────────────────────────────────────────
const VIEW_OFFSET = new THREE.Vector3(0.18, -0.20, -0.50)
const LOCAL_TILT  = new THREE.Euler(-0.04, 0.06, -0.02, 'YXZ')
const MESH_SCALE  = 0.13
const MESH_ROT    = [0.08, Math.PI + 0.35, -0.03]
const MESH_POS    = [0.0, -0.08, 0.0]

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

  // Idle 루프 재생
  useEffect(() => {
    if (!names.length) return
    const idleName = names.find(n => /idle/i.test(n))
    if (idleName && actions[idleName]) {
      actions[idleName].setLoop(THREE.LoopRepeat, Infinity)
      actions[idleName].play()
    }
  }, [actions, names])

  // Fire: 클릭 시 Idle → Fire → Idle
  useEffect(() => {
    if (!names.length) return
    const fireName = names.find(n => /fire/i.test(n)) ?? names[0]
    const idleName = names.find(n => /idle/i.test(n))

    const onDown = () => {
      if (!active || !actions[fireName]) return
      spring.current.vel = 0.12

      if (idleName && actions[idleName]) actions[idleName].stop()

      const action = actions[fireName]
      action.stop()
      action.reset()
      action.setLoop(THREE.LoopOnce, 1)
      action.clampWhenFinished = false
      action.play()

      // Fire 끝나면 Idle 복귀
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
