import { useEffect, useRef, useState, type ReactNode } from 'react'
import { useInView } from '../hooks/useInView'
import { prefersReducedMotion } from '../hooks/env'

export type Tag = 'catalog' | 'drawing' | 'concept' | 'demo' | 'nodata'

const TAG_TEXT: Record<Tag, [string, string]> = {
  catalog: ['CATALOG', 'カタログ記載値'],
  drawing: ['DRAWING', '図面寸法から換算'],
  concept: ['CONCEPT', '概念表現（実機形状ではない）'],
  demo: ['DEMO', 'デモ用操作・演出値'],
  nodata: ['NO DATA', 'カタログ未確認'],
}

export function Badge({ tag, compact }: { tag: Tag; compact?: boolean }) {
  const [en, ja] = TAG_TEXT[tag]
  return (
    <span className={`badge badge--${tag}`} title={ja}>
      {en}
      {!compact && <span className="badge__ja">{ja}</span>}
    </span>
  )
}

export function Segmented<T extends string>({ value, options, onChange, label, size = 'md' }: { value: T; options: { id: T; label: ReactNode; sub?: ReactNode; disabled?: boolean }[]; onChange: (v: T) => void; label: string; size?: 'sm' | 'md' }) {
  return (
    <div className={`seg seg--${size}`} role="radiogroup" aria-label={label}>
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          role="radio"
          aria-checked={value === o.id}
          disabled={o.disabled}
          className={`seg__btn ${value === o.id ? 'is-on' : ''}`}
          onClick={() => onChange(o.id)}
        >
          <span className="seg__label">{o.label}</span>
          {o.sub && <span className="seg__sub">{o.sub}</span>}
        </button>
      ))}
    </div>
  )
}

export function Toggle({ checked, onChange, children }: { checked: boolean; onChange: (v: boolean) => void; children: ReactNode }) {
  return (
    <label className={`toggle ${checked ? 'is-on' : ''}`}>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span className="toggle__track" aria-hidden="true">
        <span className="toggle__dot" />
      </span>
      <span className="toggle__text">{children}</span>
    </label>
  )
}

/** Animated number that eases to its new value (instant under reduced motion). */
export function CountUp({ value, decimals = 0, duration = 700 }: { value: number; decimals?: number; duration?: number }) {
  const [shown, setShown] = useState(value)
  const from = useRef(value)
  const [ref, inView] = useInView<HTMLSpanElement>('0px', true)
  const started = useRef(false)
  const [reduced] = useState(prefersReducedMotion)
  useEffect(() => {
    if (!inView) return
    if (reduced) return
    const start = started.current ? from.current : 0
    started.current = true
    const t0 = performance.now()
    let raf = 0
    const step = (t: number) => {
      const k = Math.min(1, (t - t0) / duration)
      const e = 1 - Math.pow(1 - k, 3)
      const v = start + (value - start) * e
      setShown(v)
      from.current = v
      if (k < 1) raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [value, inView, duration, reduced])
  return <span ref={ref}>{(reduced ? value : shown).toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}</span>
}

export function Reveal({ children, className = '', as: As = 'div', delay = 0 }: { children: ReactNode; className?: string; as?: 'div' | 'section' | 'header'; delay?: number }) {
  const [ref, inView] = useInView<HTMLDivElement>('-8% 0px', true)
  return (
    <As ref={ref} className={`reveal ${inView ? 'is-in' : ''} ${className}`} style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </As>
  )
}

export function SectionHead({ index, kicker, title, ja, children }: { index: string; kicker: string; title: string; ja: string; children?: ReactNode }) {
  return (
    <Reveal as="header" className="shead">
      <div className="shead__meta mono">
        <span className="shead__index">{index}</span>
        <span className="shead__rule" />
        <span>{kicker}</span>
      </div>
      <h2 className="shead__title">{title}</h2>
      <p className="shead__ja">{ja}</p>
      {children && <div className="shead__body">{children}</div>}
    </Reveal>
  )
}

export function Suit({ v }: { v: 'good' | 'fair' | 'no' }) {
  const t = v === 'good' ? '◯' : v === 'fair' ? '△' : '×'
  const label = v === 'good' ? '適' : v === 'fair' ? '条件付き' : '非対応'
  return (
    <span className={`suit suit--${v}`} title={label} aria-label={label}>
      {t}
    </span>
  )
}
