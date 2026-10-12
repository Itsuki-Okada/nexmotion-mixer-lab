import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Line } from '@react-three/drei'
import { Tag3D } from './Tag3D'
import * as THREE from 'three'
import type { Product } from '../data/products'
import type { RotationSim } from '../sim/rotation'
import type { Layout } from './layout'

export interface GuideFlags {
  showAxis?: boolean
  showArrows?: boolean
  showTrail?: boolean
  showFlow?: boolean
  showDims?: boolean
  showTags?: boolean
}

const CYAN = '#3ee6ff'
const AMBER = '#ffb547'

/**
 * Direction arrow drawn for CCW-from-top (+Y rotation). For CW the whole group is mirrored in Z,
 * which maps θ → −θ, so the arrow head and the model's motion always agree.
 */
function DirectionArc({ radius, y, sim, color = CYAN, tube = 1.6 }: { radius: number; y: number; sim: RotationSim; color?: string; tube?: number }) {
  const group = useRef<THREE.Group>(null)
  const mat = useMemo(() => new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.9, depthTest: false }), [color])
  useEffect(() => () => mat.dispose(), [mat])
  const { arc, headPos, headQuat } = useMemo(() => {
    const a0 = 0.25 * Math.PI
    const a1 = 1.55 * Math.PI
    const P = (a: number) => new THREE.Vector3(radius * Math.cos(a), 0, -radius * Math.sin(a))
    const pts = Array.from({ length: 48 }, (_, i) => P(a0 + ((a1 - a0) * i) / 47))
    const curve = new THREE.CatmullRomCurve3(pts)
    const arc = new THREE.TubeGeometry(curve, 64, tube, 6, false)
    const tangent = new THREE.Vector3(-Math.sin(a1), 0, -Math.cos(a1)) // dP/da
    const headQuat = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), tangent.normalize())
    return { arc, headPos: P(a1), headQuat }
  }, [radius, tube])
  useEffect(() => () => arc.dispose(), [arc])
  useFrame(({ clock }) => {
    if (!group.current) return
    group.current.scale.z = sim.direction === 1 ? -1 : 1
    const moving = Math.abs(sim.visualRpm) > 0.05
    // oxlint-disable-next-line react/immutability -- three.js material animated per frame
    mat.opacity = moving ? 0.65 + 0.3 * Math.sin(clock.elapsedTime * 4) : 0.55
  })
  return (
    <group ref={group} position={[0, y, 0]} renderOrder={10}>
      <mesh geometry={arc} material={mat} renderOrder={10} />
      <mesh position={headPos} quaternion={headQuat} material={mat} renderOrder={10}>
        <coneGeometry args={[tube * 3.2, tube * 8, 14]} />
      </mesh>
    </group>
  )
}

/** Fading sweep sector behind each blade: shows the path the blade tips trace. */
function Trail({ p, L, sim }: { p: Product; L: Layout; sim: RotationSim }) {
  const ref = useRef<THREE.Group>(null)
  const n = p.propeller.blades
  const geo = useMemo(() => {
    const span = Math.PI * 0.55
    const segs = 40
    const r0 = Math.max(p.shaft.diameterMm * 1.4, 8)
    const r1 = L.propR
    const pos: number[] = []
    const col: number[] = []
    const idx: number[] = []
    for (let i = 0; i <= segs; i++) {
      const f = i / segs
      const a = -span * (1 - f) // trailing side for CCW motion: from -span up to the blade at 0
      for (const r of [r0, r1]) {
        pos.push(r * Math.cos(a), 0, -r * Math.sin(a))
        col.push(0.24, 0.9, 1, Math.pow(f, 2.2) * (r === r1 ? 0.55 : 0.15))
      }
      if (i < segs) {
        const k = i * 2
        idx.push(k, k + 1, k + 2, k + 1, k + 3, k + 2)
      }
    }
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
    g.setAttribute('color', new THREE.Float32BufferAttribute(col, 4))
    g.setIndex(idx)
    return g
  }, [p.shaft.diameterMm, L.propR])
  const mat = useMemo(() => new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending }), [])
  useEffect(() => () => { geo.dispose(); mat.dispose() }, [geo, mat])
  useFrame(() => {
    if (!ref.current) return
    ref.current.rotation.y = sim.angle
    // trail sits behind the blade relative to the actual motion
    ref.current.scale.z = sim.visualRpm < 0 ? -1 : 1
    const strength = Math.min(1, Math.abs(sim.visualRpm) / 25)
    // oxlint-disable-next-line react/immutability -- three.js material animated per frame
    mat.opacity = strength
    ref.current.visible = strength > 0.02
  })
  return (
    <group ref={ref} position={[0, L.propY + 1.5, 0]}>
      {Array.from({ length: n }, (_, i) => (
        <mesh key={i} geometry={geo} material={mat} rotation={[0, (i / n) * Math.PI * 2, 0]} renderOrder={5} />
      ))}
    </group>
  )
}

function Flow({ p, L, sim }: { p: Product; L: Layout; sim: RotationSim }) {
  const ref = useRef<any>(null) // eslint-disable-line @typescript-eslint/no-explicit-any
  const x = p.geom.motorOffsetMm
  const yIn = L.T + L.H * 0.5 + 10
  const pts: [number, number, number][] = [
    [x + 104, yIn, 0],
    [x + 10, yIn, 0],
    [x, yIn - 10, 0],
    [x, L.beltY, 0],
    [0, L.beltY, 0],
    [0, L.propY, 0],
    [L.propR * 0.8, L.propY, 0],
  ]
  useFrame((_, dt) => {
    const m = ref.current?.material
    if (!m) return
    m.dashOffset -= (Math.abs(sim.visualRpm) > 0.05 ? 1 : 0.15) * dt * 60
  })
  return (
    <group>
      <Line ref={ref} points={pts} color={AMBER} lineWidth={2} dashed dashSize={10} gapSize={8} transparent opacity={0.95} depthTest={false} renderOrder={12} />
      <Tag3D position={[x + 60, yIn + 22, 0]} variant="amber" text="AIR → MOTOR → BELT → SHAFT · 概念図" />
    </group>
  )
}

function Dim({ a, b, label, offset = [0, 0, 0] }: { a: [number, number, number]; b: [number, number, number]; label: string; offset?: [number, number, number] }) {
  const tick = 6
  const vertical = Math.abs(a[1] - b[1]) > Math.abs(a[0] - b[0])
  const t: [number, number, number] = vertical ? [tick, 0, 0] : [0, tick, 0]
  const mid: [number, number, number] = [(a[0] + b[0]) / 2 + offset[0], (a[1] + b[1]) / 2 + offset[1], (a[2] + b[2]) / 2 + offset[2]]
  return (
    <group>
      <Line points={[a, b]} color={CYAN} lineWidth={1} transparent opacity={0.8} depthTest={false} renderOrder={11} />
      <Line points={[[a[0] - t[0], a[1] - t[1], a[2]], [a[0] + t[0], a[1] + t[1], a[2]]]} color={CYAN} lineWidth={1} depthTest={false} />
      <Line points={[[b[0] - t[0], b[1] - t[1], b[2]], [b[0] + t[0], b[1] + t[1], b[2]]]} color={CYAN} lineWidth={1} depthTest={false} />
      <Tag3D position={mid} variant="dim" text={label} />
    </group>
  )
}

export function Guides(props: GuideFlags & { product: Product; sim: RotationSim; L: Layout }) {
  const { product: p, sim, L, showAxis, showArrows, showTrail, showFlow, showDims, showTags } = props
  const fixR = p.geom.fixingDiaMm / 2
  const left = -L.edge - 40
  return (
    <group>
      {showAxis && (
        <group>
          <Line points={[[0, L.T + 20, 0], [0, L.propY - 70, 0]]} color={CYAN} lineWidth={1.2} dashed dashSize={14} gapSize={7} transparent opacity={0.85} depthTest={false} renderOrder={11} />
          <Line points={[[p.geom.motorOffsetMm, L.T + 30, 0], [p.geom.motorOffsetMm, L.beltY - 25, 0]]} color={'#8aa3b5'} lineWidth={1} dashed dashSize={8} gapSize={6} transparent opacity={0.6} depthTest={false} />
          {showTags && (
            <Tag3D position={[0, L.propY - 85, 0]} text="OUTPUT AXIS" />
          )}
        </group>
      )}
      {showArrows && (
        <>
          <DirectionArc radius={L.propR + 16} y={L.propY + 4} sim={sim} tube={Math.max(1.4, L.propR * 0.018)} />
          <DirectionArc radius={fixR + 12} y={p.geom.fixingHeightMm * 0.4} sim={sim} tube={1.2} />
        </>
      )}
      {showTrail && <Trail p={p} L={L} sim={sim} />}
      {showFlow && <Flow p={p} L={L} sim={sim} />}
      {showDims && (
        <group>
          <Dim a={[left, 0, 0]} b={[left, L.T, 0]} label={`${p.drawing.totalHeightMm} mm`} offset={[-24, 0, 0]} />
          <Dim a={[left + 20, 0, 0]} b={[left + 20, p.drawing.reducerTopMm, 0]} label={`${p.drawing.reducerTopMm}`} offset={[20, 0, 0]} />
          <Dim a={[-L.propR, L.propY - 30, 0]} b={[L.propR, L.propY - 30, 0]} label={`φ${p.propeller.diameterMm}`} offset={[0, -14, 0]} />
          <Dim a={[L.xMount, p.geom.armYMm + 40, 0]} b={[L.armTip, p.geom.armYMm + 40, 0]} label={`ARM ${p.arm.lengthMm}`} offset={[0, 14, 0]} />
          <Dim a={[-p.shaft.diameterMm - 26, L.shaftBottom, 0]} b={[-p.shaft.diameterMm - 26, L.shaftTop, 0]} label={`SHAFT φ${p.shaft.diameterMm}×${p.shaft.lengthMm}`} offset={[-30, 0, 0]} />
        </group>
      )}
    </group>
  )
}
