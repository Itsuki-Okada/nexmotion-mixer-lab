import { useEffect, useMemo, useRef, type ReactNode } from 'react'
import { useFrame, type ThreeEvent } from '@react-three/fiber'
import * as THREE from 'three'
import type { Product } from '../data/products'
import type { PartId } from '../data/parts'
import type { RotationSim } from '../sim/rotation'
import { applyVisual, makeKit, type Kit, type PartVisual } from './materials'
import { bladeGeometry, chamferCyl, lathe, roundedBox, stadiumSlab } from './geometry'
import { layoutOf, type Layout } from './layout'
import { Guides, type GuideFlags } from './Guides'
import { BeltDrive } from './BeltDrive'

export interface MixerProps extends GuideFlags {
  product: Product
  sim: RotationSim
  highlight?: PartId | null
  focusMode?: boolean
  hidden?: Partial<Record<PartId, boolean>>
  xray?: boolean
  explode?: number
  interactive?: boolean
  onHover?: (id: PartId | null) => void
  onSelect?: (id: PartId) => void
}

interface PartCtx {
  visual: (id: PartId) => PartVisual
  hidden?: Partial<Record<PartId, boolean>>
  explode: number
  interactive?: boolean
  onHover?: (id: PartId | null) => void
  onSelect?: (id: PartId) => void
}

const EXPLODE: Record<PartId, [number, number, number]> = {
  inlet: [30, 190, 0],
  exhaust: [-60, 150, 0],
  motor: [0, 105, 0],
  reducer: [0, 0, 0],
  arm: [110, 20, 0],
  fixing: [0, -55, 0],
  shaft: [0, -120, 0],
  propeller: [0, -200, 0],
  stand: [0, -160, -120],
}

function Part({ id, ctx, children }: { id: PartId; ctx: PartCtx; children: (k: Kit) => ReactNode }) {
  const kit = useMemo(() => makeKit(), [])
  const ref = useRef<THREE.Group>(null)
  const v = ctx.visual(id)
  useEffect(() => applyVisual(kit, v), [kit, v])
  useEffect(() => () => kit.all.forEach((m) => m.dispose()), [kit])
  const target = useMemo(() => new THREE.Vector3(), [])
  useFrame((_, dt) => {
    if (!ref.current) return
    const e = EXPLODE[id]
    target.set(e[0] * ctx.explode, e[1] * ctx.explode, e[2] * ctx.explode)
    ref.current.position.lerp(target, 1 - Math.exp(-Math.min(dt, 0.1) * 7))
  })
  const handlers = ctx.interactive
    ? {
        onPointerOver: (e: ThreeEvent<PointerEvent>) => {
          e.stopPropagation()
          ctx.onHover?.(id)
          document.body.style.cursor = 'pointer'
        },
        onPointerOut: () => {
          ctx.onHover?.(null)
          document.body.style.cursor = ''
        },
        onClick: (e: ThreeEvent<MouseEvent>) => {
          e.stopPropagation()
          ctx.onSelect?.(id)
        },
      }
    : {}
  return (
    <group ref={ref} visible={!ctx.hidden?.[id]} {...handlers}>
      {children(kit)}
    </group>
  )
}

export function Mixer(props: MixerProps) {
  const { product: p, sim, highlight = null, focusMode = false, hidden, xray = false, explode = 0, interactive, onHover, onSelect } = props
  const L = useMemo(() => layoutOf(p), [p])
  const rot = useRef<THREE.Group>(null)

  useFrame((_, dt) => {
    sim.update(dt)
    if (rot.current) rot.current.rotation.y = sim.angle
  })

  const visual = (id: PartId): PartVisual => {
    const see = xray && (id === 'reducer' || id === 'motor')
    if (highlight === id) return see ? 'highlightGhost' : 'highlight'
    if (highlight && focusMode) return 'dim'
    if (see) return 'ghost'
    return 'normal'
  }
  const ctx: PartCtx = { visual, hidden, explode, interactive, onHover, onSelect }

  return (
    <group scale={0.001}>
      {/* ---------- static assembly ---------- */}
      <Part id="reducer" ctx={ctx}>{(k) => <Reducer p={p} L={L} k={k} />}</Part>
      <Part id="motor" ctx={ctx}>{(k) => <Motor p={p} k={k} />}</Part>
      <Part id="inlet" ctx={ctx}>{(k) => <Inlet p={p} L={L} k={k} />}</Part>
      <Part id="exhaust" ctx={ctx}>{(k) => <Exhaust p={p} L={L} k={k} />}</Part>
      <Part id="arm" ctx={ctx}>{(k) => <Arm p={p} L={L} k={k} />}</Part>
      <Part id="stand" ctx={ctx}>{(k) => <Stand p={p} L={L} k={k} />}</Part>

      {/* ---------- rotating assembly (output axis) ---------- */}
      <group ref={rot}>
        <Part id="fixing" ctx={ctx}>{(k) => <Fixing p={p} k={k} />}</Part>
        <Part id="shaft" ctx={ctx}>{(k) => <Shaft p={p} L={L} k={k} />}</Part>
        <Part id="propeller" ctx={ctx}>{(k) => <Propeller p={p} L={L} k={k} />}</Part>
      </group>

      {xray && <BeltDrive p={p} L={L} sim={sim} />}
      <Guides {...props} L={L} />
    </group>
  )
}

/* ================================================================== */

function Reducer({ p, L, k }: { p: Product; L: Layout; k: Kit }) {
  const g = p.geom
  const top = p.drawing.reducerTopMm
  const lidH = Math.max(4, (top - g.housingBottomMm) * 0.14)
  const bodyH = top - g.housingBottomMm - lidH - 1.2
  const body = useMemo(() => stadiumSlab(-L.edge, g.housingRightMm, g.housingDepthMm, bodyH, 3.5), [L.edge, g.housingRightMm, g.housingDepthMm, bodyH])
  const lid = useMemo(() => stadiumSlab(-L.edge + 2, g.housingRightMm - 2, g.housingDepthMm - 4, lidH, 1.5), [L.edge, g.housingRightMm, g.housingDepthMm, lidH])
  const gasket = useMemo(() => stadiumSlab(-L.edge + 1.5, g.housingRightMm - 1.5, g.housingDepthMm - 3, 1.4, 0.4), [L.edge, g.housingRightMm, g.housingDepthMm])
  const bossBottom = g.fixingHeightMm + (g.housingBottomMm - g.fixingHeightMm) * 0.3
  const bossH = g.housingBottomMm - bossBottom
  return (
    <group>
      <mesh geometry={body} material={k.nickel} position={[0, g.housingBottomMm, 0]} castShadow receiveShadow />
      <mesh geometry={gasket} material={k.dark} position={[0, g.housingBottomMm + bodyH, 0]} />
      <mesh geometry={lid} material={k.brushed} position={[0, g.housingBottomMm + bodyH + 1.2, 0]} castShadow />
      {/* bearing boss under the output axis */}
      <mesh material={k.nickel} position={[0, bossBottom, 0]} castShadow>
        <primitive object={chamferCyl(g.bossDiaMm / 2, bossH + 1, 2)} attach="geometry" />
      </mesh>
      {/* output-axis cap on the lid */}
      <mesh material={k.steel} position={[0, top - 0.5, 0]}>
        <primitive object={chamferCyl(Math.max(8, p.shaft.diameterMm * 1.1), 4, 1)} attach="geometry" />
      </mesh>
      {/* lid screws */}
      {[
        [-L.edge + 9, g.housingDepthMm / 2 - 9],
        [-L.edge + 9, -g.housingDepthMm / 2 + 9],
        [g.housingRightMm - 9, g.housingDepthMm / 2 - 9],
        [g.housingRightMm - 9, -g.housingDepthMm / 2 + 9],
      ].map(([x, z], i) => (
        <mesh key={i} material={k.dark} position={[x, top - 0.2, z]}>
          <cylinderGeometry args={[2.6, 2.6, 1.6, 16]} />
        </mesh>
      ))}
    </group>
  )
}

function Motor({ p, k }: { p: Product; k: Kit }) {
  const g = p.geom
  const x = g.motorOffsetMm
  const base0 = p.drawing.reducerTopMm
  const T = p.drawing.totalHeightMm
  const capR = g.bodyDiaMm * 0.36
  const body = useMemo(() => {
    const r = g.bodyDiaMm / 2
    const h = g.bodyTopMm - g.neckTopMm
    return lathe([
      [0, 0], [r * 0.82, 0], [r * 0.97, h * 0.05], [r, h * 0.14], [r, h * 0.86], [r * 0.97, h * 0.95], [r * 0.82, h], [0, h],
    ])
  }, [g.bodyDiaMm, g.bodyTopMm, g.neckTopMm])
  const roundBase = p.stand.type === 'U'
  const baseH = g.motorBaseTopMm - base0
  return (
    <group position={[x, 0, 0]}>
      {roundBase ? (
        <mesh material={k.steel} position={[0, base0, 0]} castShadow>
          <primitive object={chamferCyl(g.motorBaseDiaMm / 2, baseH, 2)} attach="geometry" />
        </mesh>
      ) : (
        <group position={[0, base0 + baseH / 2, 0]}>
          <mesh material={k.nickel} castShadow>
            <primitive object={roundedBox(g.motorBaseDiaMm, baseH, g.motorBaseDiaMm * 0.92, 5)} attach="geometry" />
          </mesh>
          <mesh material={k.dark} position={[g.motorBaseDiaMm * 0.28, baseH * 0.12, g.motorBaseDiaMm * 0.46 + 0.3]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[4, 4, 1, 20]} />
          </mesh>
        </group>
      )}
      {/* dark collar */}
      <mesh material={k.dark} position={[0, g.motorBaseTopMm, 0]}>
        <primitive object={chamferCyl(g.neckDiaMm / 2 + 2.5, 4, 1)} attach="geometry" />
      </mesh>
      <mesh material={k.steel} position={[0, g.motorBaseTopMm + 4, 0]} castShadow>
        <primitive object={chamferCyl(g.neckDiaMm / 2, g.neckTopMm - g.motorBaseTopMm - 4, 1.2)} attach="geometry" />
      </mesh>
      {/* motor body — dark exterior as seen in the catalog photos */}
      <mesh geometry={body} material={k.rubber} position={[0, g.neckTopMm, 0]} castShadow />
      {[0.33, 0.66].map((f) => (
        <mesh key={f} material={k.dark} position={[0, g.neckTopMm + (g.bodyTopMm - g.neckTopMm) * f, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[g.bodyDiaMm / 2, 0.9, 8, 48]} />
        </mesh>
      ))}
      <mesh material={k.steel} position={[0, g.bodyTopMm, 0]} castShadow>
        <primitive object={chamferCyl(capR, T - g.bodyTopMm, 1.5)} attach="geometry" />
      </mesh>
    </group>
  )
}

function Inlet({ p, L, k }: { p: Product; L: Layout; k: Kit }) {
  const x = p.geom.motorOffsetMm
  const { T, H } = L
  const yPipe = T + H * 0.5
  const ball = p.geom.valve === 'ball'
  return (
    <group position={[x, 0, 0]}>
      <mesh material={k.steel} position={[0, T, 0]}>
        <cylinderGeometry args={[9, 9, 6, 6]} />
      </mesh>
      <mesh material={k.chrome} position={[0, (T + yPipe) / 2, 0]}>
        <cylinderGeometry args={[6, 6, yPipe - T, 24]} />
      </mesh>
      {/* elbow */}
      <mesh material={k.chrome} position={[10, yPipe, 0]} rotation={[0, 0, 0]}>
        <torusGeometry args={[10, 6, 14, 24, Math.PI / 2]} />
      </mesh>
      <mesh material={k.chrome} position={[10, yPipe, 0]}>
        <sphereGeometry args={[6.2, 16, 12]} />
      </mesh>
      {/* horizontal run */}
      <mesh material={k.steel} position={[30, yPipe + 10, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[5, 5, 30, 20]} />
      </mesh>
      {/* valve body */}
      <mesh material={k.chrome} position={[52, yPipe + 10, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[9, 9, 20, 6]} />
      </mesh>
      {ball ? (
        <group position={[52, yPipe + 19, 0]}>
          <mesh material={k.steel}>
            <cylinderGeometry args={[3, 3, 8, 12]} />
          </mesh>
          <mesh material={k.chrome} position={[30, 5, 0]} rotation={[0, 0, -0.06]}>
            <boxGeometry args={[62, 2.5, 7]} />
          </mesh>
          <mesh material={k.dark} position={[60, 3, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[4, 4, 8, 12]} />
          </mesh>
        </group>
      ) : (
        <group position={[52, yPipe + 19, 0]}>
          <mesh material={k.steel} position={[0, 8, 0]}>
            <cylinderGeometry args={[3.5, 3.5, 18, 12]} />
          </mesh>
          <mesh material={k.dark} position={[0, H * 0.5 - 12, 0]}>
            <cylinderGeometry args={[14, 14, 8, 8]} />
          </mesh>
        </group>
      )}
      {/* one-touch fitting + coupler */}
      <mesh material={k.steel} position={[72, yPipe + 10, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[6, 6, 22, 20]} />
      </mesh>
      <mesh material={k.knurl} position={[88, yPipe + 10, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[7.5, 7.5, 12, 24]} />
      </mesh>
      <mesh material={k.chrome} position={[99, yPipe + 10, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[4.5, 5.5, 10, 20]} />
      </mesh>
    </group>
  )
}

function Exhaust({ p, L, k }: { p: Product; L: Layout; k: Kit }) {
  const g = p.geom
  const x = g.motorOffsetMm
  const { T, H } = L
  const y = T + H * 0.32
  const bowlR = g.bodyDiaMm * 0.3
  const silR = g.bodyDiaMm * 0.24
  const bowlX = -g.bodyDiaMm * 0.95
  const silX = bowlX - bowlR - silR - 6
  const bowlH = H * 0.95
  const silH = H * 1.15
  return (
    <group position={[x, 0, 0]}>
      <mesh material={k.chrome} position={[(bowlX + silX) / 2 - 2, y, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[5, 5, -silX + 4, 18]} />
      </mesh>
      {/* filter head + clear bowl (concept placement from photos) */}
      <mesh material={k.nickel} position={[bowlX, y, 0]}>
        <primitive object={roundedBox(bowlR * 2.4, 14, bowlR * 2.4, 3)} attach="geometry" />
      </mesh>
      <mesh material={k.clear} position={[bowlX, y - 7 - bowlH, 0]}>
        <primitive object={lathe([[0, 0], [bowlR * 0.5, 0], [bowlR * 0.92, bowlH * 0.12], [bowlR, bowlH * 0.4], [bowlR, bowlH], [0, bowlH]], 32)} attach="geometry" />
      </mesh>
      <mesh material={k.steel} position={[bowlX, y - 7 - bowlH - 4, 0]}>
        <cylinderGeometry args={[2.5, 2.5, 8, 10]} />
      </mesh>
      {/* silencer: perforated sleeve */}
      <mesh material={k.steel} position={[silX, y - 4, 0]}>
        <cylinderGeometry args={[silR + 1.5, silR + 1.5, 8, 24]} />
      </mesh>
      <mesh material={k.perforated} position={[silX, y - 8 - silH / 2, 0]}>
        <cylinderGeometry args={[silR, silR, silH, 28, 1, true]} />
      </mesh>
      <mesh material={k.dark} position={[silX, y - 8 - silH / 2, 0]}>
        <cylinderGeometry args={[silR * 0.7, silR * 0.7, silH * 0.98, 16]} />
      </mesh>
      <mesh material={k.steel} position={[silX, y - 8 - silH - 2, 0]}>
        <cylinderGeometry args={[silR + 1, silR + 1, 4, 24]} />
      </mesh>
    </group>
  )
}

function Arm({ p, L, k }: { p: Product; L: Layout; k: Kit }) {
  const g = p.geom
  const r = p.arm.diameterMm / 2
  const y = g.armYMm
  const plateW = L.xMount - g.housingRightMm + 6
  const blockH = p.arm.diameterMm * 2.6
  return (
    <group>
      {/* bracket plate bolted to the reducer */}
      <mesh material={k.nickel} position={[g.housingRightMm - 3 + plateW / 2, y, 0]} castShadow>
        <primitive object={roundedBox(plateW, blockH * 1.15, g.housingDepthMm * 0.5, 3)} attach="geometry" />
      </mesh>
      {[-0.28, 0.28].map((f) => (
        <mesh key={f} material={k.dark} position={[L.xMount - 8, y + blockH * f, g.housingDepthMm * 0.25 + 0.4]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[3.2, 3.2, 1, 16]} />
        </mesh>
      ))}
      {/* hinged clamp block */}
      <mesh material={k.steel} position={[L.xMount + L.clampW / 2, y, 0]} castShadow>
        <primitive object={roundedBox(L.clampW, blockH, p.arm.diameterMm * 2.1, 4)} attach="geometry" />
      </mesh>
      {/* clamp lever */}
      <group position={[L.xMount + L.clampW * 0.55, y, p.arm.diameterMm * 1.05]}>
        <mesh material={k.chrome} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[5, 5, 6, 20]} />
        </mesh>
        <mesh material={k.dark} position={[0, -22, 4]} rotation={[0.18, 0, 0]}>
          <capsuleGeometry args={[3.2, 34, 4, 12]} />
        </mesh>
      </group>
      {/* arm rod */}
      <mesh material={k.chrome} position={[(L.xMount + L.clampW - 4 + L.armTip) / 2, y, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[r, r, L.armTip - L.xMount - L.clampW + 4, 28]} />
      </mesh>
      <mesh material={k.chrome} position={[L.armTip, y, 0]}>
        <sphereGeometry args={[r, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
      </mesh>
    </group>
  )
}

function Stand({ p, L, k }: { p: Product; L: Layout; k: Kit }) {
  const y0 = L.floorY
  const poleH = L.poleTop - y0
  const R = L.poleD / 2
  const footY = y0 + 6
  return (
    <group>
      {/* pole */}
      <mesh material={k.chrome} position={[L.poleX, y0 + poleH / 2, L.poleZ]} castShadow>
        <cylinderGeometry args={[R, R, poleH, 28]} />
      </mesh>
      <mesh material={k.chrome} position={[L.poleX, L.poleTop, L.poleZ]}>
        <sphereGeometry args={[R, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2]} />
      </mesh>
      {/* cross clamp joining arm and pole */}
      <group position={[L.poleX, p.geom.armYMm, L.poleZ / 2]}>
        <mesh material={k.steel} castShadow>
          <primitive object={roundedBox(L.poleD + 14, p.arm.diameterMm * 2.4, -L.poleZ + L.poleD + 6, 4)} attach="geometry" />
        </mesh>
        <mesh material={k.dark} position={[0, 0, (-L.poleZ + L.poleD) / 2 + 12]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[7, 7, 12, 8]} />
        </mesh>
      </group>
      {p.stand.type === 'U' && <BaseU L={L} k={k} y={y0} />}
      {p.stand.type === 'V2' && <BaseV L={L} k={k} y={y0} />}
      {p.stand.type === 'H2' && <BaseH L={L} k={k} y={y0} />}
      <mesh material={k.chrome} position={[L.poleX, footY + 6, L.poleZ]}>
        <cylinderGeometry args={[R + 6, R + 8, 12, 28]} />
      </mesh>
    </group>
  )
}

function BaseU({ L, k, y }: { L: Layout; k: Kit; y: number }) {
  // cast "U/Y" base: two legs reaching forward under the shaft from the pole (concept)
  const geo = useMemo(() => {
    const s = new THREE.Shape()
    const px = L.poleX
    const pz = -L.poleZ
    const reach = px + 90
    s.moveTo(px + 40, pz)
    s.quadraticCurveTo(px + 40, pz + 70, px - reach * 0.55, pz + 150)
    s.quadraticCurveTo(px - reach * 0.62, pz + 150, px - reach * 0.6, pz + 118)
    s.quadraticCurveTo(px - 10, pz + 40, px - 10, pz)
    s.quadraticCurveTo(px - 10, pz - 40, px - reach * 0.6, pz - 118)
    s.quadraticCurveTo(px - reach * 0.62, pz - 150, px - reach * 0.55, pz - 150)
    s.quadraticCurveTo(px + 40, pz - 70, px + 40, pz)
    const g = new THREE.ExtrudeGeometry(s, { depth: 14, bevelEnabled: true, bevelSize: 4, bevelThickness: 4, bevelSegments: 3, curveSegments: 20 })
    g.rotateX(-Math.PI / 2)
    g.computeVertexNormals()
    return g
  }, [L.poleX, L.poleZ])
  return (
    <group position={[0, y + 4, 0]}>
      <mesh geometry={geo} material={k.cast} castShadow receiveShadow />
    </group>
  )
}

function BaseV({ L, k, y }: { L: Layout; k: Kit; y: number }) {
  const len = L.poleX + 260
  const ang = 0.42
  return (
    <group position={[L.poleX, y + 9, L.poleZ]}>
      {[ang, -ang].map((a) => (
        <group key={a} rotation={[0, Math.PI + a, 0]}>
          <mesh material={k.chrome} position={[len / 2, 0, 0]} castShadow>
            <primitive object={roundedBox(len, 12, 46, 5)} attach="geometry" />
          </mesh>
          <mesh material={k.rubber} position={[len - 18, -8, 0]}>
            <cylinderGeometry args={[11, 12, 8, 20]} />
          </mesh>
        </group>
      ))}
    </group>
  )
}

function BaseH({ L, k, y }: { L: Layout; k: Kit; y: number }) {
  const t = 38
  const cross = 560
  const len = L.poleX + 420
  const z = cross / 2 - t / 2
  return (
    <group position={[L.poleX, y + t / 2 + 14, L.poleZ]}>
      <mesh material={k.brushed} castShadow>
        <primitive object={roundedBox(t, t, cross, 3)} attach="geometry" />
      </mesh>
      {[z, -z].map((zz) => (
        <group key={zz}>
          <mesh material={k.brushed} position={[-len / 2 + t / 2, 0, zz]} castShadow>
            <primitive object={roundedBox(len, t, t, 3)} attach="geometry" />
          </mesh>
          {[-len + 30, 0].map((xx) => (
            <group key={xx} position={[xx, -t / 2 - 7, zz]}>
              <mesh material={k.steel}>
                <cylinderGeometry args={[3, 3, 14, 10]} />
              </mesh>
              <mesh material={k.rubber} position={[0, -6, 0]}>
                <cylinderGeometry args={[13, 14, 5, 20]} />
              </mesh>
            </group>
          ))}
        </group>
      ))}
    </group>
  )
}

function Fixing({ p, k }: { p: Product; k: Kit }) {
  const g = p.geom
  const h = g.fixingHeightMm
  const R = g.fixingDiaMm / 2
  const neckTop = g.fixingHeightMm + (g.housingBottomMm - g.fixingHeightMm) * 0.3 + 2
  const neckR = Math.max(5, p.shaft.diameterMm * 0.95)
  if (p.shaftFixing.kind === 'setbolt') {
    return (
      <group>
        <mesh material={k.steel} castShadow>
          <primitive object={chamferCyl(R, h, 1.5)} attach="geometry" />
        </mesh>
        <mesh material={k.steel} position={[0, h, 0]}>
          <cylinderGeometry args={[neckR * 1.6, neckR * 1.6, neckTop - h, 28]} />
        </mesh>
        {[0.3, 0.68].map((f) => (
          <mesh key={f} material={k.dark} position={[0, h * f, R - 0.6]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[3, 3, 2.4, 6]} />
          </mesh>
        ))}
        {/* rotation index mark: makes the turning visible on a plain cylinder */}
        <mesh material={k.brass} position={[R - 0.2, h * 0.5, 0]}>
          <boxGeometry args={[1.2, h * 0.8, 3]} />
        </mesh>
      </group>
    )
  }
  const sleeve = lathe([
    [R * 0.7, h * 0.1], [R, h * 0.16], [R, h * 0.6], [R * 0.92, h * 0.66], [R * 0.7, h * 0.66],
  ])
  return (
    <group>
      <mesh material={k.steel}>
        <primitive object={lathe([[0, 0], [R * 0.32, 0], [R * 0.42, h * 0.04], [R * 0.62, h * 0.12], [R * 0.7, h * 0.16], [0, h * 0.16]])} attach="geometry" />
      </mesh>
      <mesh material={k.knurl} castShadow>
        <primitive object={sleeve} attach="geometry" />
      </mesh>
      <mesh material={k.steel} castShadow>
        <primitive object={lathe([[0, h * 0.64], [R * 0.9, h * 0.64], [R * 0.9, h * 0.86], [R * 0.6, h], [0, h]])} attach="geometry" />
      </mesh>
      <mesh material={k.brass} position={[0, h * 0.75, R * 0.9]}>
        <boxGeometry args={[3, h * 0.12, 1]} />
      </mesh>
      <mesh material={k.steel} position={[0, (h + neckTop) / 2, 0]}>
        <cylinderGeometry args={[neckR, neckR, neckTop - h, 24]} />
      </mesh>
    </group>
  )
}

function Shaft({ p, L, k }: { p: Product; L: Layout; k: Kit }) {
  const r = p.shaft.diameterMm / 2
  const len = L.shaftTop - L.shaftBottom
  return (
    <mesh material={k.chrome} position={[0, L.shaftBottom, 0]} castShadow>
      <primitive object={lathe([[0, 0], [r * 0.8, 0], [r, r * 0.3], [r, len], [0, len]], 28)} attach="geometry" />
    </mesh>
  )
}

function Propeller({ p, L, k }: { p: Product; L: Layout; k: Kit }) {
  const n = p.propeller.blades
  const D = p.propeller.diameterMm
  const small = D < 80
  const hubR = Math.max(p.shaft.diameterMm * 1.15, 7)
  const hubH = Math.max(14, D * 0.12)
  const blade = useMemo(
    () =>
      bladeGeometry({
        radius: D / 2,
        hubR,
        chord: small ? D * 0.44 : D * 0.34,
        thickness: small ? 1.4 : Math.max(1.8, D * 0.012),
        pitchDeg: small ? 16 : 28,
        lobe: small,
      }),
    [D, hubR, small],
  )
  return (
    <group position={[0, L.propY, 0]}>
      <mesh material={k.steel} position={[0, -hubH / 2, 0]} castShadow>
        <primitive object={chamferCyl(hubR, hubH, 1.2)} attach="geometry" />
      </mesh>
      <mesh material={k.dark} position={[hubR - 0.4, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[2, 2, 1.4, 6]} />
      </mesh>
      {Array.from({ length: n }, (_, i) => (
        <mesh key={i} geometry={blade} material={k.brushed} rotation={[0, (i / n) * Math.PI * 2, 0]} castShadow />
      ))}
    </group>
  )
}
