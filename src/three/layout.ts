import type { Product } from '../data/products'

/**
 * Derived scene layout in millimetres. Origin: output-shaft axis, y = 0 at the bottom of the
 * shaft-fixing part (the lowest point of the catalog dimension drawing).
 */
export function layoutOf(p: Product) {
  const g = p.geom
  const d = p.drawing
  const edge = d.shaftToReducerEdgeMm
  const xMount = d.shaftToArmMountMm - edge
  const clampW = p.arm.lengthMm - p.arm.reachMm
  const armTip = xMount + p.arm.lengthMm
  const shaftTop = g.fixingHeightMm * 0.55
  const shaftBottom = shaftTop - p.shaft.lengthMm
  const propR = p.propeller.diameterMm / 2
  const propY = shaftBottom + Math.max(14, p.propeller.diameterMm * 0.1)
  const floorY = shaftBottom - 45
  const poleD = p.stand.type === 'U' ? 16 : p.stand.type === 'V2' ? 25 : 30
  const poleX = armTip - 22
  const poleZ = -(p.arm.diameterMm / 2 + poleD / 2 + 4)
  const poleTop = g.armYMm + 170
  const T = d.totalHeightMm
  const H = d.inletHeightMm
  const top = T + H
  const beltY = (g.housingBottomMm + d.reducerTopMm) / 2
  const r1 = Math.min(edge, g.housingDepthMm / 2) * 0.72
  const r2 = r1 * 0.5
  return { edge, xMount, clampW, armTip, shaftTop, shaftBottom, propR, propY, floorY, poleD, poleX, poleZ, poleTop, T, H, top, beltY, r1, r2 }
}

export type Layout = ReturnType<typeof layoutOf>

/** Camera framing (metres): target centre and a distance that fits the assembly. */
export function frameOf(p: Product, mode: 'full' | 'head' = 'full') {
  const L = layoutOf(p)
  if (mode === 'head') {
    const cy = L.top / 2 / 1000
    const h = (L.top + 60) / 1000
    return { target: [L.xMount / 2000, cy, 0] as [number, number, number], radius: Math.max(h, (L.armTip + L.edge) / 1000) * 0.62 }
  }
  const cy = ((L.top + L.floorY) / 2) / 1000
  const h = (L.top - L.floorY) / 1000
  const w = (L.poleX + L.edge + 120) / 1000
  return { target: [(L.poleX - L.edge) / 2000, cy, 0] as [number, number, number], radius: Math.max(h, w) * 0.55 }
}
