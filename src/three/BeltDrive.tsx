import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { Product } from '../data/products'
import type { RotationSim } from '../sim/rotation'
import { beltCurve, lathe } from './geometry'
import type { Layout } from './layout'
import { Tag3D } from './Tag3D'

const TEETH = 42

/**
 * CONCEPT visual of the timing-belt reducer (the catalog states "timing-belt drive, no oil";
 * pulley sizes, ratio and internal layout are not published). Kinematics are self-consistent:
 * both pulleys share the same belt surface speed, so the motor pulley turns r1/r2 times faster.
 */
export function BeltDrive({ p, L, sim }: { p: Product; L: Layout; sim: RotationSim }) {
  const d = p.geom.motorOffsetMm
  const y = L.beltY
  const { r1, r2 } = L
  const curve = useMemo(() => beltCurve(r1 + 1.6, r2 + 1.6, d, y), [r1, r2, d, y])
  const tube = useMemo(() => new THREE.TubeGeometry(curve, 160, 1.4, 6, true), [curve])
  const perimeter = useMemo(() => curve.getLength(), [curve])
  const big = useRef<THREE.Group>(null)
  const small = useRef<THREE.Group>(null)
  const teeth = useRef<THREE.InstancedMesh>(null)
  const tmp = useMemo(() => new THREE.Object3D(), [])
  const pulley = (r: number, h: number) =>
    lathe([[0, 0], [r + 2.5, 0], [r + 2.5, 1.2], [r, 2], [r, h - 2], [r + 2.5, h - 1.2], [r + 2.5, h], [0, h]], 40)

  useEffect(() => () => tube.dispose(), [tube])

  const mats = useMemo(
    () => ({
      pulley: new THREE.MeshStandardMaterial({ color: '#b9c3cc', metalness: 0.9, roughness: 0.3, emissive: '#0b3b44', emissiveIntensity: 0.6 }),
      belt: new THREE.MeshStandardMaterial({ color: '#0d1013', roughness: 0.7, emissive: '#0e2a30', emissiveIntensity: 0.6 }),
      tooth: new THREE.MeshBasicMaterial({ color: '#3ee6ff' }),
      mark: new THREE.MeshBasicMaterial({ color: '#ffb547' }),
    }),
    [],
  )
  useEffect(() => () => Object.values(mats).forEach((m) => m.dispose()), [mats])

  useFrame(() => {
    const a = sim.angle
    if (big.current) big.current.rotation.y = a
    if (small.current) small.current.rotation.y = a * ((r1 + 1.6) / (r2 + 1.6))
    if (teeth.current) {
      // belt travel = output angle × pitch radius; curve parameter runs CCW like +angle
      const s = (a * (r1 + 1.6)) / perimeter
      for (let i = 0; i < TEETH; i++) {
        let t = (i / TEETH + s) % 1
        if (t < 0) t += 1
        curve.getPointAt(t, tmp.position)
        tmp.updateMatrix()
        teeth.current.setMatrixAt(i, tmp.matrix)
      }
      teeth.current.instanceMatrix.needsUpdate = true
    }
  })

  const h = 9
  return (
    <group>
      <group ref={big} position={[0, y - h / 2, 0]}>
        <mesh geometry={pulley(r1, h)} material={mats.pulley} />
        <mesh material={mats.mark} position={[r1 * 0.55, h + 0.2, 0]}>
          <boxGeometry args={[r1 * 0.8, 0.6, 2.4]} />
        </mesh>
      </group>
      <group ref={small} position={[d, y - h / 2, 0]}>
        <mesh geometry={pulley(r2, h)} material={mats.pulley} />
        <mesh material={mats.mark} position={[r2 * 0.55, h + 0.2, 0]}>
          <boxGeometry args={[r2 * 0.8, 0.6, 2]} />
        </mesh>
        {/* motor output spindle (concept) */}
        <mesh material={mats.pulley} position={[0, h, 0]}>
          <cylinderGeometry args={[3, 3, p.drawing.reducerTopMm - y, 16]} />
        </mesh>
      </group>
      <mesh geometry={tube} material={mats.belt} />
      <instancedMesh ref={teeth} args={[undefined, undefined, TEETH]} material={mats.tooth}>
        <sphereGeometry args={[1.5, 8, 6]} />
      </instancedMesh>
      <Tag3D position={[d / 2, y + 14, -L.r1 - 10]} variant="concept" text="TIMING BELT · CONCEPT" />
    </group>
  )
}
