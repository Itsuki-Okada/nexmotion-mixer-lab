import { Suspense, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { ContactShadows, Environment, Grid, Lightformer, OrbitControls, PerformanceMonitor } from '@react-three/drei'
import * as THREE from 'three'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import { useInView } from '../hooks/useInView'
import { hasWebGL, isCoarsePointer, prefersReducedMotion } from '../hooks/env'

export type ViewPreset = 'iso' | 'front' | 'side' | 'top' | 'hero'

export interface Framing {
  target: [number, number, number]
  radius: number
}

function presetPosition(preset: ViewPreset, f: Framing, aspect: number): THREE.Vector3 {
  // distance that fits a sphere of `radius` in a 30° vertical FOV; pull back on narrow viewports
  const k = (f.radius / Math.tan(THREE.MathUtils.degToRad(15))) * 1.04 / Math.min(1, Math.max(aspect, 0.5))
  const [x, y, z] = f.target
  switch (preset) {
    case 'front': return new THREE.Vector3(x, y, z + k)
    case 'side': return new THREE.Vector3(x + k, y, z)
    case 'top': return new THREE.Vector3(x, y + k * 1.05, z + 0.001)
    case 'hero': return new THREE.Vector3(x - k * 0.42, y + k * 0.12, z + k * 0.9)
    case 'iso':
    default: return new THREE.Vector3(x + k * 0.55, y + k * 0.38, z + k * 0.8)
  }
}

/** Smoothly moves camera + orbit target to a preset; yields to the user as soon as they drag. */
function CameraRig({ preset, framing, nonce, autoRotate }: { preset: ViewPreset; framing: Framing; nonce: number; autoRotate: boolean }) {
  const { camera, size } = useThree()
  const controls = useThree((s) => s.controls) as unknown as OrbitControlsImpl | null
  const goal = useRef({ pos: new THREE.Vector3(), target: new THREE.Vector3(), active: false })
  const first = useRef(true)

  useEffect(() => {
    goal.current.pos.copy(presetPosition(preset, framing, size.width / size.height))
    goal.current.target.set(...framing.target)
    goal.current.active = true
    if (first.current && controls) {
      // first frame: jump straight there (no fly-in from the origin)
      camera.position.copy(goal.current.pos)
      controls.target.copy(goal.current.target)
      controls.update()
      first.current = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preset, framing.target[0], framing.target[1], framing.target[2], framing.radius, nonce, controls])

  useEffect(() => {
    if (!controls) return
    const stop = () => (goal.current.active = false)
    controls.addEventListener('start', stop)
    return () => controls.removeEventListener('start', stop)
  }, [controls])

  useFrame((_, dt) => {
    if (!controls) return
    controls.autoRotate = autoRotate && !goal.current.active
    if (goal.current.active) {
      const k = 1 - Math.exp(-Math.min(dt, 0.1) * 4.5)
      camera.position.lerp(goal.current.pos, k)
      controls.target.lerp(goal.current.target, k)
      if (camera.position.distanceTo(goal.current.pos) < 0.002 && controls.target.distanceTo(goal.current.target) < 0.001) goal.current.active = false
    }
    controls.update()
  })
  return null
}

function Studio({ floorY, gridColor }: { floorY: number; gridColor: string }) {
  return (
    <>
      <ambientLight intensity={0.18} />
      <directionalLight position={[2.5, 4, 3]} intensity={2.2} color="#ffffff" />
      <directionalLight position={[-3, 2, -2]} intensity={1.6} color="#3ee6ff" />
      <spotLight position={[0, 3.5, -2.5]} angle={0.5} penumbra={0.9} intensity={18} color="#7ff0ff" distance={9} />
      <Environment resolution={256} frames={1}>
        <color attach="background" args={['#121a23']} />
        <Lightformer form="rect" intensity={2.4} position={[0, 4, 1]} scale={[8, 2, 1]} rotation-x={Math.PI / 2} color="#ffffff" />
        <Lightformer form="rect" intensity={2.2} position={[-4, 1, 0]} scale={[1.2, 6, 1]} rotation-y={Math.PI / 2} color="#bfefff" />
        <Lightformer form="rect" intensity={1.6} position={[4, 0.5, -1]} scale={[1, 5, 1]} rotation-y={-Math.PI / 2} color="#3ee6ff" />
        <Lightformer form="ring" intensity={1.2} position={[0, 1, -4]} scale={2.5} color="#ffffff" />
        <Lightformer form="rect" intensity={0.5} position={[0, -3, 0]} scale={[8, 8, 1]} rotation-x={-Math.PI / 2} color="#1a2330" />
      </Environment>
      <Grid
        position={[0, floorY + 0.0005, 0]}
        args={[10, 10]}
        cellSize={0.05}
        cellThickness={0.6}
        cellColor={gridColor}
        sectionSize={0.25}
        sectionThickness={1}
        sectionColor="#1f6f80"
        fadeDistance={4.2}
        fadeStrength={2.4}
        infiniteGrid
      />
      <ContactShadows position={[0, floorY + 0.001, 0]} opacity={0.75} scale={3} blur={2.6} far={1.2} resolution={512} frames={1} color="#000000" />
    </>
  )
}

export interface StageProps {
  children: ReactNode
  framing: Framing
  floorY: number
  preset?: ViewPreset
  presetNonce?: number
  autoRotate?: boolean
  enableZoom?: boolean
  /** false: camera is fixed (used on touch devices where a drag should scroll the page) */
  interactive?: boolean
  className?: string
  label?: string
  /** remount key for contact shadows when the model changes */
  sceneKey?: string
  fallback?: ReactNode
}

export function Stage({ children, framing, floorY, preset = 'iso', presetNonce = 0, autoRotate = false, enableZoom = true, interactive = true, className, label, sceneKey, fallback }: StageProps) {
  // mount the WebGL context only once the view first approaches the viewport, then keep it
  const [wrap, inView, mounted] = useInView<HTMLDivElement>('300px')
  const [ready, setReady] = useState(false)
  const [dpr, setDpr] = useState(1.5)
  const webgl = useMemo(() => hasWebGL(), [])
  const coarse = useMemo(() => isCoarsePointer(), [])
  const reduced = useMemo(() => prefersReducedMotion(), [])
  const maxDpr = coarse ? 1.5 : 2

  return (
    <div ref={wrap} className={`stage ${className ?? ''}`} role="img" aria-label={label}>
      <div className={`stage__fallback ${webgl && ready ? 'is-hidden' : ''} ${webgl ? '' : 'stage__fallback--nogl'}`} aria-hidden={webgl && ready}>
        {webgl ? fallback : <>{fallback}<p className="stage__nowebgl mono">WebGL が利用できないため、静的な図で表示しています。</p></>}
      </div>
      {webgl && mounted && (
        <Canvas
          frameloop={inView ? 'always' : 'never'}
          dpr={[1, Math.min(dpr, maxDpr)]}
          gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
          camera={{ fov: 30, near: 0.01, far: 40, position: [1.5, 1, 2] }}
          onCreated={({ gl }) => {
            gl.toneMapping = THREE.ACESFilmicToneMapping
            gl.toneMappingExposure = 1.05
            // reveal after a couple of frames so the first visible frame is fully lit
            requestAnimationFrame(() => requestAnimationFrame(() => setReady(true)))
          }}
          style={interactive ? undefined : { touchAction: 'pan-y', pointerEvents: 'none' }}
        >
          <PerformanceMonitor onDecline={() => setDpr(1)} onIncline={() => setDpr(maxDpr)} />
          <Suspense fallback={null}>
            <Studio key={sceneKey} floorY={floorY} gridColor="#16323b" />
            {children}
          </Suspense>
          <OrbitControls
            makeDefault
            enabled={interactive}
            enableDamping
            dampingFactor={0.08}
            enablePan={false}
            enableZoom={enableZoom}
            minDistance={framing.radius * 0.6}
            maxDistance={framing.radius * 7}
            autoRotateSpeed={reduced ? 0 : 0.6}
            maxPolarAngle={Math.PI * 0.62}
          />
          <CameraRig preset={preset} framing={framing} nonce={presetNonce} autoRotate={autoRotate && !reduced} />
        </Canvas>
      )}
    </div>
  )
}
