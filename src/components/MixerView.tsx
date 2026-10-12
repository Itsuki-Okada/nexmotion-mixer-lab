import { useMemo } from 'react'
import type { Product } from '../data/products'
import { Mixer, type MixerProps } from '../three/Mixer'
import { Stage, type Framing, type ViewPreset } from '../three/Stage'
import { frameOf, layoutOf } from '../three/layout'
import { Blueprint } from './Blueprint'

export interface MixerViewProps extends Omit<MixerProps, 'product'> {
  product: Product
  preset?: ViewPreset
  presetNonce?: number
  autoRotate?: boolean
  enableZoom?: boolean
  interactiveCamera?: boolean
  /** override framing, e.g. a shared one for same-scale comparison */
  framing?: Framing
  frameMode?: 'full' | 'head'
  className?: string
  label?: string
}

export function MixerView({ product, preset, presetNonce, autoRotate, enableZoom, interactiveCamera = true, framing, frameMode = 'full', className, label, ...mixer }: MixerViewProps) {
  const f = useMemo(() => framing ?? frameOf(product, frameMode), [framing, product, frameMode])
  const floorY = layoutOf(product).floorY / 1000
  return (
    <Stage
      framing={f}
      floorY={floorY}
      preset={preset}
      presetNonce={presetNonce}
      autoRotate={autoRotate}
      enableZoom={enableZoom}
      interactive={interactiveCamera}
      className={className}
      label={label ?? `${product.name} 3Dビュー`}
      sceneKey={product.id}
      fallback={<Blueprint product={product} />}
    >
      <Mixer product={product} {...mixer} />
    </Stage>
  )
}
