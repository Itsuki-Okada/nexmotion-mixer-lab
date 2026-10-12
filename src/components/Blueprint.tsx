import type { Product } from '../data/products'
import { layoutOf } from '../three/layout'

/**
 * Static line drawing generated from the same layout data as the 3D model.
 * Used while WebGL initialises and as the no-WebGL fallback.
 */
export function Blueprint({ product: p, note = 'INITIALIZING 3D VIEW' }: { product: Product; note?: string }) {
  const L = layoutOf(p)
  const g = p.geom
  const x0 = -L.edge - 60
  const x1 = L.poleX + 60
  const y0 = L.floorY - 20
  const y1 = L.top + 30
  const W = x1 - x0
  const H = y1 - y0
  const Y = (y: number) => y1 - y // flip
  const sw = Math.max(W, H) / 380
  return (
    <div className="blueprint">
      <svg viewBox={`${x0} 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet" aria-hidden="true">
        <g fill="none" stroke="currentColor" strokeWidth={sw} strokeLinejoin="round">
          {/* floor */}
          <line x1={x0 + 20} x2={x1 - 20} y1={Y(L.floorY)} y2={Y(L.floorY)} strokeDasharray={`${sw * 6} ${sw * 4}`} opacity={0.5} />
          {/* pole + arm */}
          <rect x={L.poleX - L.poleD / 2} y={Y(L.poleTop)} width={L.poleD} height={L.poleTop - L.floorY} />
          <rect x={L.xMount} y={Y(g.armYMm + p.arm.diameterMm / 2)} width={p.arm.lengthMm} height={p.arm.diameterMm} />
          {/* reducer */}
          <rect x={-L.edge} y={Y(p.drawing.reducerTopMm)} width={L.edge + g.housingRightMm} height={p.drawing.reducerTopMm - g.housingBottomMm} rx={sw * 3} />
          {/* motor */}
          <rect x={g.motorOffsetMm - g.motorBaseDiaMm / 2} y={Y(g.motorBaseTopMm)} width={g.motorBaseDiaMm} height={g.motorBaseTopMm - p.drawing.reducerTopMm} />
          <rect x={g.motorOffsetMm - g.neckDiaMm / 2} y={Y(g.neckTopMm)} width={g.neckDiaMm} height={g.neckTopMm - g.motorBaseTopMm} />
          <rect x={g.motorOffsetMm - g.bodyDiaMm / 2} y={Y(g.bodyTopMm)} width={g.bodyDiaMm} height={g.bodyTopMm - g.neckTopMm} rx={sw * 4} />
          <rect x={g.motorOffsetMm - g.bodyDiaMm * 0.36} y={Y(L.T)} width={g.bodyDiaMm * 0.72} height={L.T - g.bodyTopMm} />
          {/* fixing + shaft + propeller */}
          <rect x={-g.fixingDiaMm / 2} y={Y(g.fixingHeightMm)} width={g.fixingDiaMm} height={g.fixingHeightMm} rx={sw * 2} />
          <rect x={-p.shaft.diameterMm / 2} y={Y(L.shaftTop)} width={p.shaft.diameterMm} height={p.shaft.lengthMm} />
          <path d={`M ${-L.propR} ${Y(L.propY)} Q 0 ${Y(L.propY + 10)} ${L.propR} ${Y(L.propY)}`} />
          <line x1={-L.propR} x2={L.propR} y1={Y(L.propY - 4)} y2={Y(L.propY - 4)} />
        </g>
        <g stroke="var(--cyan)" strokeWidth={sw * 0.8} strokeDasharray={`${sw * 8} ${sw * 5}`}>
          <line x1={0} x2={0} y1={Y(L.T + 20)} y2={Y(L.propY - 50)} />
        </g>
      </svg>
      <span className="blueprint__note mono">{note}</span>
    </div>
  )
}
