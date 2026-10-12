import { useEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'

/**
 * Minimal screen-space label anchored to a 3D point. A plain DOM node positioned every frame —
 * avoids creating a nested React root per label.
 */
export function Tag3D({ position, text, variant = '' }: { position: [number, number, number]; text: string; variant?: '' | 'amber' | 'concept' | 'dim' }) {
  const gl = useThree((s) => s.gl)
  const camera = useThree((s) => s.camera)
  const size = useThree((s) => s.size)
  const anchor = useRef<THREE.Group>(null)
  const elRef = useRef<HTMLDivElement | null>(null)
  const v = useMemo(() => new THREE.Vector3(), [])

  useEffect(() => {
    const host = gl.domElement.parentElement
    if (!host) return
    const el = document.createElement('div')
    elRef.current = el
    el.textContent = text
    el.className = `tag3d tag3d--abs ${variant ? `tag3d--${variant}` : ''}`
    el.setAttribute('aria-hidden', 'true')
    host.appendChild(el)
    return () => {
      el.remove()
      elRef.current = null
    }
    // text is applied below; recreating the node on text change is unnecessary
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gl, variant])

  useEffect(() => {
    if (elRef.current) elRef.current.textContent = text
  }, [text])

  useFrame(() => {
    const a = anchor.current
    const el = elRef.current
    if (!a || !el) return
    a.getWorldPosition(v)
    v.project(camera)
    const hidden = v.z > 1 || !a.parent?.visible
    el.style.display = hidden ? 'none' : ''
    if (hidden) return
    const x = ((v.x + 1) / 2) * size.width
    const y = ((1 - v.y) / 2) * size.height
    el.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) translate(-50%, -50%)`
  })

  return <group ref={anchor} position={position} />
}
