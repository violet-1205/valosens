/* @refresh reset */
import { useEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { useAnimations, useGLTF } from '@react-three/drei'
import * as THREE from 'three'

const MODEL_PATH = '/mark_23__animated_free.glb'

// Model placement (tune these values as needed)
const VIEW_OFFSET = new THREE.Vector3(1.60, -0.90, -2.20)
const MESH_SCALE = 0.02
const MESH_ROT = [0.12, Math.PI + 0.10, -0.02]
const MESH_POS = [0.0, 0.0, 0.0]

const LOCAL_TILT = new THREE.Euler(-0.04, 0.06, -0.02, 'YXZ')
const RECOIL_KICK = 0.14
const RECOIL_STIFF = 26
const RECOIL_DAMPING = 11
const RECOIL_PITCH = 2.2

const _offset = new THREE.Vector3()
const _localEuler = new THREE.Euler(0, 0, 0, 'YXZ')
const _localQuat = new THREE.Quaternion()
const _box = new THREE.Box3()
const _center = new THREE.Vector3()

export default function GunViewModel({ active = true }) {
  const groupRef = useRef(null)
  const modelRootRef = useRef(null)
  const spring = useRef({ pos: 0, vel: 0 })
  const idleActionRef = useRef(null)
  const fireActionRef = useRef(null)
  const { camera } = useThree()

  const { scene, animations } = useGLTF(MODEL_PATH)
  const modelScene = useMemo(() => {
    const cloned = scene.clone(true)
    // Re-center model so VIEW_OFFSET/MESH_POS adjustments are immediately visible.
    _box.setFromObject(cloned)
    if (!_box.isEmpty()) {
      _box.getCenter(_center)
      cloned.position.sub(_center)
    }
    return cloned
  }, [scene])
  const { actions, names } = useAnimations(animations, modelRootRef)

  useEffect(() => {
    modelScene.traverse((obj) => {
      if (obj.isMesh) obj.frustumCulled = false
    })
  }, [modelScene])

  useEffect(() => {
    if (!names.length) return
    const idleName = names[0] ?? null
    const fireName = names[2] ?? null

    Object.values(actions).forEach((action) => action?.stop())

    idleActionRef.current = idleName ? actions[idleName] ?? null : null
    fireActionRef.current = fireName ? actions[fireName] ?? null : null

    if (names.length < 3) {
      console.warn('[GunViewModel] Expected at least 3 animations for current model')
    }

    // Keep the first animation as a static base pose.
    const idleAction = idleActionRef.current
    if (idleAction) {
      idleAction.reset()
      idleAction.setLoop(THREE.LoopOnce, 1)
      idleAction.clampWhenFinished = true
      idleAction.play()
      idleAction.paused = true
      idleAction.time = 0
    }
  }, [actions, names])

  useEffect(() => {
    const onMouseDown = () => {
      if (!active) return

      spring.current.vel = RECOIL_KICK

      const fireAction = fireActionRef.current
      if (!fireAction) return

      const idleAction = idleActionRef.current
      if (idleAction) idleAction.stop()

      fireAction.stop()
      fireAction.reset()
      fireAction.setLoop(THREE.LoopOnce, 1)
      fireAction.clampWhenFinished = true
      fireAction.play()

      const mixer = fireAction.getMixer()
      const onFinished = (event) => {
        if (event.action !== fireAction) return
        mixer.removeEventListener('finished', onFinished)

        // Return to the static base pose after the shot animation.
        if (idleAction) {
          idleAction.reset()
          idleAction.setLoop(THREE.LoopOnce, 1)
          idleAction.clampWhenFinished = true
          idleAction.play()
          idleAction.paused = true
          idleAction.time = 0
        }
      }
      mixer.addEventListener('finished', onFinished)
    }

    window.addEventListener('mousedown', onMouseDown)
    return () => window.removeEventListener('mousedown', onMouseDown)
  }, [active])

  useFrame((_, dt) => {
    if (!groupRef.current) return

    const s = spring.current
    s.vel += (-s.pos * RECOIL_STIFF - s.vel * RECOIL_DAMPING) * dt
    s.pos += s.vel * dt

    _offset.copy(VIEW_OFFSET).applyQuaternion(camera.quaternion).add(camera.position)
    groupRef.current.position.copy(_offset)

    _localEuler.set(LOCAL_TILT.x - s.pos * RECOIL_PITCH, LOCAL_TILT.y, LOCAL_TILT.z)
    _localQuat.setFromEuler(_localEuler)
    groupRef.current.quaternion.multiplyQuaternions(camera.quaternion, _localQuat)

    groupRef.current.visible = active
  })

  return (
    <group ref={groupRef}>
      <primitive
        ref={modelRootRef}
        object={modelScene}
        scale={MESH_SCALE}
        rotation={MESH_ROT}
        position={MESH_POS}
      />
    </group>
  )
}

useGLTF.preload(MODEL_PATH)
