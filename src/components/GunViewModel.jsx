/* @refresh reset */
import { useEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'

const MODEL_PATH = '/Fps%20Rig.glb'
const VIEW_OFFSET = new THREE.Vector3(0.75, -0.85, -1.2)
const MESH_SCALE = 0.03
const MESH_ROT = [0, Math.PI, 0]
const MESH_POS = [0, 0, 0]

const LOCAL_TILT = new THREE.Euler(-0.04, 0.06, -0.02, 'YXZ')

const _offset = new THREE.Vector3()
const _localEuler = new THREE.Euler(0, 0, 0, 'YXZ')
const _localQuat = new THREE.Quaternion()
const _box = new THREE.Box3()
const _center = new THREE.Vector3()

export default function GunViewModel({ active = true }) {
  const groupRef = useRef(null)
  const { camera } = useThree()

  const { scene } = useGLTF(MODEL_PATH)
  const modelScene = useMemo(() => {
    const cloned = scene.clone(true)
    // Re-center model so placement constants map directly to screen position.
    _box.setFromObject(cloned)
    if (!_box.isEmpty()) {
      _box.getCenter(_center)
      cloned.position.sub(_center)
    }
    return cloned
  }, [scene])
  useEffect(() => {
    modelScene.traverse((obj) => {
      if (obj.isMesh) obj.frustumCulled = false
    })
  }, [modelScene])

  useFrame(() => {
    if (!groupRef.current) return

    _offset
      .copy(VIEW_OFFSET)
      .applyQuaternion(camera.quaternion)
      .add(camera.position)
    groupRef.current.position.copy(_offset)

    _localEuler.copy(LOCAL_TILT)
    _localQuat.setFromEuler(_localEuler)
    groupRef.current.quaternion.multiplyQuaternions(camera.quaternion, _localQuat)
    groupRef.current.visible = active
  })

  return (
    <group ref={groupRef}>
      <primitive
        object={modelScene}
        scale={MESH_SCALE}
        rotation={MESH_ROT}
        position={MESH_POS}
      />
    </group>
  )
}

useGLTF.preload(MODEL_PATH)
