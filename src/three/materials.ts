import * as THREE from 'three'
import { brushedTexture, knurlTexture, perforatedTexture } from './geometry'

export interface Kit {
  steel: THREE.MeshStandardMaterial
  brushed: THREE.MeshStandardMaterial
  nickel: THREE.MeshStandardMaterial
  chrome: THREE.MeshStandardMaterial
  dark: THREE.MeshStandardMaterial
  rubber: THREE.MeshStandardMaterial
  cast: THREE.MeshStandardMaterial
  clear: THREE.MeshStandardMaterial
  perforated: THREE.MeshStandardMaterial
  knurl: THREE.MeshStandardMaterial
  brass: THREE.MeshStandardMaterial
  all: THREE.MeshStandardMaterial[]
}

/** One kit per part, so highlight / x-ray state can be applied part by part. */
export function makeKit(): Kit {
  const m = (p: THREE.MeshStandardMaterialParameters) => new THREE.MeshStandardMaterial(p)
  const steel = m({ color: '#dfe3e8', metalness: 1, roughness: 0.2, envMapIntensity: 1.1 })
  const brushed = m({ color: '#c8ccd2', metalness: 1, roughness: 0.42, roughnessMap: brushedTexture(), envMapIntensity: 1 })
  const nickel = m({ color: '#d4d0c6', metalness: 0.95, roughness: 0.28, envMapIntensity: 1 })
  const chrome = m({ color: '#f1f4f7', metalness: 1, roughness: 0.07, envMapIntensity: 1.25 })
  const dark = m({ color: '#17191d', metalness: 0.35, roughness: 0.5 })
  const rubber = m({ color: '#0e0f11', metalness: 0, roughness: 0.85 })
  const cast = m({ color: '#1d2025', metalness: 0.55, roughness: 0.48 })
  const clear = m({ color: '#cfe9f2', metalness: 0, roughness: 0.05, transparent: true, opacity: 0.32, depthWrite: false })
  const perforated = m({ color: '#d7dbe0', metalness: 1, roughness: 0.3, alphaMap: perforatedTexture(), alphaTest: 0.5, side: THREE.DoubleSide })
  const knurl = m({ color: '#cfd3d8', metalness: 1, roughness: 0.32, bumpMap: knurlTexture(), bumpScale: 2.5 })
  const brass = m({ color: '#c9a35a', metalness: 1, roughness: 0.3 })
  const all = [steel, brushed, nickel, chrome, dark, rubber, cast, clear, perforated, knurl, brass]
  all.forEach((x) => {
    x.userData.base = { opacity: x.opacity, transparent: x.transparent, depthWrite: x.depthWrite }
  })
  return { steel, brushed, nickel, chrome, dark, rubber, cast, clear, perforated, knurl, brass, all }
}

const CYAN = new THREE.Color('#3ee6ff')
const BLACK = new THREE.Color('#000000')

export type PartVisual = 'normal' | 'highlight' | 'highlightGhost' | 'dim' | 'ghost'

export function applyVisual(kit: Kit, v: PartVisual) {
  for (const mat of kit.all) {
    const base = mat.userData.base as { opacity: number; transparent: boolean; depthWrite: boolean }
    const hi = v === 'highlight' || v === 'highlightGhost'
    mat.emissive.copy(hi ? CYAN : BLACK)
    mat.emissiveIntensity = hi ? 0.14 : 0
    if (v === 'dim' || v === 'ghost' || v === 'highlightGhost') {
      mat.transparent = true
      mat.opacity = base.opacity * (v === 'ghost' ? 0.12 : v === 'highlightGhost' ? 0.3 : 0.22)
      mat.depthWrite = false
    } else {
      mat.transparent = base.transparent
      mat.opacity = base.opacity
      mat.depthWrite = base.depthWrite
    }
    mat.needsUpdate = true
  }
}
