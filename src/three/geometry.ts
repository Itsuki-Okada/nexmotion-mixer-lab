import * as THREE from 'three'

/** All builders work in millimetres; the mixer group is scaled to metres once at the top. */

const SEG = 48

const cache = new Map<string, THREE.BufferGeometry>()
/** Geometries are immutable once built, so identical arguments share one instance. */
function memo<A extends unknown[], G extends THREE.BufferGeometry>(name: string, fn: (...a: A) => G) {
  return (...a: A): G => {
    const key = name + JSON.stringify(a)
    let g = cache.get(key) as G | undefined
    if (!g) {
      g = fn(...a)
      cache.set(key, g)
    }
    return g
  }
}

/** Revolve a [radius, y] profile around Y. */
function _lathe(profile: [number, number][], segments = SEG) {
  const g = new THREE.LatheGeometry(profile.map(([r, y]) => new THREE.Vector2(r, y)), segments)
  g.computeVertexNormals()
  return g
}

/** Cylinder with chamfered edges, base at y=0. */
function _chamferCyl(r: number, h: number, c = Math.min(r, h) * 0.12, segments = SEG) {
  return lathe(
    [
      [0, 0],
      [r - c, 0],
      [r, c],
      [r, h - c],
      [r - c, h],
      [0, h],
    ],
    segments,
  )
}

/** Stadium (two semicircles + straight sides) in the XZ plane, extruded along +Y with bevel. */
function _stadiumSlab(x0: number, x1: number, depth: number, height: number, bevel = 3) {
  const r = depth / 2
  const s = new THREE.Shape()
  // shape is drawn in (x, -z) so that after rotateX(-PI/2) it lies in XZ and extrudes up
  const a = x0 + r
  const b = x1 - r
  s.moveTo(a, -r)
  s.lineTo(b, -r)
  s.absarc(b, 0, r, -Math.PI / 2, Math.PI / 2, false)
  s.lineTo(a, r)
  s.absarc(a, 0, r, Math.PI / 2, (3 * Math.PI) / 2, false)
  const g = new THREE.ExtrudeGeometry(s, {
    depth: height - bevel * 2,
    bevelEnabled: true,
    bevelThickness: bevel,
    bevelSize: bevel,
    bevelSegments: 3,
    curveSegments: 28,
  })
  g.rotateX(-Math.PI / 2)
  g.translate(0, bevel, 0)
  g.computeVertexNormals()
  return g
}

/** Rounded box via extrude, centred on origin. */
function _roundedBox(w: number, h: number, d: number, r = 3) {
  const s = new THREE.Shape()
  const x = -w / 2
  const y = -h / 2
  s.moveTo(x + r, y)
  s.lineTo(x + w - r, y)
  s.quadraticCurveTo(x + w, y, x + w, y + r)
  s.lineTo(x + w, y + h - r)
  s.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
  s.lineTo(x + r, y + h)
  s.quadraticCurveTo(x, y + h, x, y + h - r)
  s.lineTo(x, y + r)
  s.quadraticCurveTo(x, y, x + r, y)
  const b = Math.min(r * 0.6, d * 0.2)
  const g = new THREE.ExtrudeGeometry(s, { depth: d - b * 2, bevelEnabled: true, bevelSize: b, bevelThickness: b, bevelSegments: 2, curveSegments: 6 })
  g.translate(0, 0, -d / 2 + b)
  g.computeVertexNormals()
  return g
}

/**
 * Marine-style propeller blade: a skewed petal outline extruded thin, then pitched about its
 * radial axis. Returns geometry for a single blade pointing along +X, centred on the hub axis.
 */
function _bladeGeometry(opts: { radius: number; hubR: number; chord: number; thickness: number; pitchDeg: number; lobe?: boolean }) {
  const { radius, hubR, chord, thickness, pitchDeg, lobe } = opts
  const s = new THREE.Shape()
  const L = radius - hubR * 0.6
  const x0 = hubR * 0.6
  if (lobe) {
    // rounded "flower" lobe used by the small 4-blade propeller
    s.moveTo(x0, -chord * 0.28)
    s.bezierCurveTo(x0 + L * 0.35, -chord * 0.62, x0 + L * 1.02, -chord * 0.55, x0 + L, 0)
    s.bezierCurveTo(x0 + L * 1.02, chord * 0.55, x0 + L * 0.35, chord * 0.62, x0, chord * 0.28)
  } else {
    // swept petal: wide leading side, trailing tip curl
    s.moveTo(x0, -chord * 0.22)
    s.bezierCurveTo(x0 + L * 0.3, -chord * 0.7, x0 + L * 0.95, -chord * 0.62, x0 + L, -chord * 0.08)
    s.bezierCurveTo(x0 + L * 1.02, chord * 0.18, x0 + L * 0.7, chord * 0.42, x0 + L * 0.42, chord * 0.36)
    s.bezierCurveTo(x0 + L * 0.2, chord * 0.32, x0 + L * 0.06, chord * 0.26, x0, chord * 0.22)
  }
  const bev = Math.min(thickness * 0.35, 0.6)
  const g = new THREE.ExtrudeGeometry(s, { depth: Math.max(thickness - bev * 2, 0.2), bevelEnabled: true, bevelSize: bev, bevelThickness: bev, bevelSegments: 2, curveSegments: 18 })
  g.translate(0, 0, -thickness / 2 + bev)
  // shape lies in XY; lay it flat (XZ), then pitch about the radial (X) axis
  g.rotateX(-Math.PI / 2)
  g.rotateX(THREE.MathUtils.degToRad(pitchDeg))
  g.computeVertexNormals()
  return g
}

/** Circle-to-circle open belt path in the XZ plane (CCW-from-top as parameter increases). */
export function beltCurve(r1: number, r2: number, d: number, y: number) {
  // big pulley at x=0 (r1), small pulley at x=d (r2). Tangent normal angle:
  const beta = Math.acos((r2 - r1) / d)
  const pts: THREE.Vector3[] = []
  // map 2D (u, v) -> (x=u, z=-v) so increasing angle is CCW seen from +Y
  const P = (cx: number, r: number, a: number) => new THREE.Vector3(cx + r * Math.cos(a), y, -r * Math.sin(a))
  const n1 = 40
  for (let i = 0; i <= n1; i++) pts.push(P(0, r1, beta + ((2 * Math.PI - 2 * beta) * i) / n1))
  const n2 = 24
  for (let i = 0; i <= n2; i++) pts.push(P(d, r2, -beta + (2 * beta * i) / n2))
  return new THREE.CatmullRomCurve3(pts, true, 'centripetal')
}

let knurlTex: THREE.CanvasTexture | null = null
/** Diamond knurl pattern used as a bump map on the drill chuck sleeve. */
export function knurlTexture() {
  if (knurlTex) return knurlTex
  const c = document.createElement('canvas')
  c.width = c.height = 64
  const x = c.getContext('2d')!
  x.fillStyle = '#808080'
  x.fillRect(0, 0, 64, 64)
  x.strokeStyle = '#1a1a1a'
  x.lineWidth = 3
  for (let i = -64; i < 128; i += 16) {
    x.beginPath(); x.moveTo(i, 0); x.lineTo(i + 64, 64); x.stroke()
    x.beginPath(); x.moveTo(i + 64, 0); x.lineTo(i, 64); x.stroke()
  }
  knurlTex = new THREE.CanvasTexture(c)
  knurlTex.wrapS = knurlTex.wrapT = THREE.RepeatWrapping
  knurlTex.repeat.set(10, 3)
  return knurlTex
}

let perfTex: THREE.CanvasTexture | null = null
/** Perforated-metal alpha map for the silencer sleeve. */
export function perforatedTexture() {
  if (perfTex) return perfTex
  const c = document.createElement('canvas')
  c.width = c.height = 64
  const x = c.getContext('2d')!
  x.fillStyle = '#ffffff'
  x.fillRect(0, 0, 64, 64)
  x.fillStyle = '#000000'
  for (let r = 0; r < 4; r++)
    for (let k = 0; k < 4; k++) {
      x.beginPath()
      x.arc(8 + k * 16 + (r % 2) * 8, 8 + r * 16, 4.2, 0, Math.PI * 2)
      x.fill()
    }
  perfTex = new THREE.CanvasTexture(c)
  perfTex.wrapS = perfTex.wrapT = THREE.RepeatWrapping
  perfTex.repeat.set(6, 5)
  return perfTex
}

let brushTex: THREE.CanvasTexture | null = null
/** Subtle anisotropic-looking brush streaks as a roughness map (cheap stand-in for anisotropy). */
export function brushedTexture() {
  if (brushTex) return brushTex
  const c = document.createElement('canvas')
  c.width = 256
  c.height = 8
  const x = c.getContext('2d')!
  for (let i = 0; i < 256; i++) {
    const v = 150 + Math.floor(Math.random() * 70)
    x.fillStyle = `rgb(${v},${v},${v})`
    x.fillRect(i, 0, 1, 8)
  }
  brushTex = new THREE.CanvasTexture(c)
  brushTex.wrapS = brushTex.wrapT = THREE.RepeatWrapping
  brushTex.repeat.set(2, 1)
  return brushTex
}

export const lathe = memo('lathe', _lathe)
export const chamferCyl = memo('chamferCyl', _chamferCyl)
export const stadiumSlab = memo('stadiumSlab', _stadiumSlab)
export const roundedBox = memo('roundedBox', _roundedBox)
export const bladeGeometry = memo('bladeGeometry', _bladeGeometry)
