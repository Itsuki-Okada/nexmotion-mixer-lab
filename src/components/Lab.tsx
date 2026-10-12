import { useEffect, useMemo, useState } from 'react'
import { Box, Crosshair, Eye, Pause, Play, RotateCcw, RotateCw, Square, Undo2, X } from 'lucide-react'
import { OP_POINTS, PRODUCTS, airFor, productById, rpmFor, type OpPoint, type Product } from '../data/products'
import { PARTS, partById, type PartId } from '../data/parts'
import { useSim, useTicker } from '../hooks/useSim'
import type { ViewPreset } from '../three/Stage'
import { MixerView } from './MixerView'
import { Badge, CountUp, Segmented, SectionHead, Toggle } from './ui'

const SLOW_STEPS = [1, 2, 5, 10, 20, 30, 50, 100]
const PRESETS: { id: ViewPreset; label: string }[] = [
  { id: 'iso', label: 'ISO' },
  { id: 'front', label: 'FRONT' },
  { id: 'side', label: 'SIDE' },
  { id: 'top', label: 'TOP' },
]

export function Lab() {
  const [pid, setPid] = useState<Product['id']>('axis10')
  const product = productById(pid)
  const [motorId, setMotorId] = useState<'A' | 'B' | 'C' | 'D'>('B')
  const motor = product.motors.find((m) => m.id === motorId) ?? product.motors[0]
  const [op, setOp] = useState<OpPoint>('noload06')
  const [slowIdx, setSlowIdx] = useState(4)
  const slowN = SLOW_STEPS[slowIdx]
  const rpm = rpmFor(motor, op)
  const air = airFor(motor, op)

  const sim = useSim({ rpm, slowMotion: 1 / slowN, running: false })
  useTicker(12)
  useEffect(() => sim.set({ rpm, slowMotion: 1 / slowN }), [sim, rpm, slowN])

  const [structure, setStructure] = useState(false)
  const [guides, setGuides] = useState({ axis: true, arrows: true, trail: true, dims: false, flow: false })
  const [hidden, setHidden] = useState<Partial<Record<PartId, boolean>>>({})
  const [preset, setPreset] = useState<ViewPreset>('iso')
  const [nonce, setNonce] = useState(0)
  const [hover, setHover] = useState<PartId | null>(null)
  const [selected, setSelected] = useState<PartId | null>(null)


  const resetAll = () => {
    sim.reset()
    setOp('noload06')
    setSlowIdx(4)
    setStructure(false)
    setGuides({ axis: true, arrows: true, trail: true, dims: false, flow: false })
    setHidden({})
    setSelected(null)
    setPreset('iso')
    setNonce((n) => n + 1)
  }

  const liveRpm = Math.abs(sim.visualRpm)
  const realPeriodMs = 60000 / rpm
  const visPeriodS = (60 * slowN) / rpm
  const deg = (((-sim.angle * 180) / Math.PI) % 360 + 360) % 360
  const status = sim.paused
    ? 'PAUSED'
    : !sim.running && liveRpm < 0.05
      ? 'STOPPED'
      : sim.running
        ? Math.abs(liveRpm - rpm / slowN) < Math.max(0.5, (rpm / slowN) * 0.02) ? 'RUNNING' : 'SPIN-UP'
        : 'SPIN-DOWN'
  const shownPart = selected ?? hover
  const info = shownPart ? partById(shownPart) : null

  const opOptions = useMemo(() => OP_POINTS.map((o) => ({ id: o.id, label: o.short, sub: `${rpmFor(motor, o.id)} rpm` })), [motor])

  return (
    <section className="section lab" id="lab" aria-labelledby="lab-title">
      <SectionHead index="01" kicker="INTERACTIVE LAB" title="Drive it. Watch every axis." ja="回転シミュレーション：モデル・モーター・運転条件を選んで、回転部を観察する">
        <p>
          表示中の回転数はすべてカタログ記載値です。実機の速度そのままでは目で追えないため、アニメーションは
          <b> スロー再生倍率 </b>
          を掛けて表示し、両者を分けて表示しています。
        </p>
      </SectionHead>

      <div className="lab__grid">
        <div className="lab__viewport panel">
          <div className="vp-top mono">
            <span className={`status status--${status.toLowerCase()}`}>
              <span className="dot" /> {status}
            </span>
            <span className="vp-title">
              {product.name} <em>/ MOTOR {motor.id}</em>
            </span>
            <span className="vp-axis">θ {deg.toFixed(1).padStart(5, '0')}°</span>
          </div>
          <MixerView
            product={product}
            sim={sim}
            preset={preset}
            presetNonce={nonce}
            showAxis={guides.axis}
            showArrows={guides.arrows}
            showTrail={guides.trail}
            showDims={guides.dims}
            showFlow={guides.flow || structure}
            showTags
            xray={structure}
            hidden={hidden}
            highlight={shownPart}
            interactive
            onHover={setHover}
            onSelect={(id) => setSelected((s) => (s === id ? null : id))}
            className="lab__stage"
          />
          <div className="vp-presets" role="group" aria-label="視点プリセット">
            {PRESETS.map((p) => (
              <button
                key={p.id}
                type="button"
                className={`chip ${preset === p.id ? 'is-on' : ''}`}
                onClick={() => {
                  setPreset(p.id)
                  setNonce((n) => n + 1)
                }}
              >
                {p.label}
              </button>
            ))}
            <button type="button" className="chip" onClick={() => { setPreset('iso'); setNonce((n) => n + 1) }} aria-label="初期視点に戻す">
              <Crosshair size={13} /> RESET VIEW
            </button>
          </div>
          {info && (
            <div className="part-card" role="status">
              <div className="part-card__head">
                <span className="mono part-card__en">{info.en}</span>
                {selected && (
                  <button type="button" className="icon-btn" onClick={() => setSelected(null)} aria-label="部品の選択を解除">
                    <X size={14} />
                  </button>
                )}
              </div>
              <div className="part-card__name">
                {info.name} {info.rotates && <span className="pill pill--cyan">回転部</span>}
              </div>
              <p>{info.role(product)}</p>
              <p className="part-card__mat">{info.material(product)}</p>
              <div className="part-card__src">
                形状: <Badge tag={info.shapeSource} compact />
              </div>
            </div>
          )}
          <div className="vp-hint mono">DRAG 回転 · WHEEL/PINCH ズーム · 部品をクリックで解説</div>
        </div>

        <div className="lab__panel panel" aria-label="操作パネル">
          <div className="ctl-group">
            <div className="ctl-label mono">MODEL</div>
            <Segmented
              label="モデル選択"
              value={pid}
              onChange={(v) => {
                setPid(v)
                setSelected(null)
              }}
              options={PRODUCTS.map((p) => ({ id: p.id, label: p.name, sub: `φ${p.shaft.diameterMm} shaft` }))}
            />
          </div>

          <div className="ctl-group">
            <div className="ctl-label mono">
              AIR MOTOR TYPE <Badge tag="catalog" compact />
            </div>
            <Segmented
              label="モータータイプ"
              size="sm"
              value={motor.id}
              onChange={(v) => setMotorId(v)}
              options={product.motors.map((m) => ({ id: m.id, label: m.id, sub: `${m.torqueNm} N·m` }))}
            />
          </div>

          <div className="ctl-group">
            <div className="ctl-label mono">
              OPERATING POINT <Badge tag="catalog" compact />
            </div>
            <Segmented label="運転条件" size="sm" value={op} onChange={setOp} options={opOptions} />
            <p className="ctl-note">{OP_POINTS.find((o) => o.id === op)!.note}</p>
          </div>

          <div className="readout">
            <div className="readout__main">
              <span className="mono readout__k">CATALOG SPEED</span>
              <span className="readout__v">
                <CountUp value={rpm} />
                <small>rpm</small>
              </span>
              <span className="readout__s mono">1回転 {realPeriodMs.toFixed(1)} ms（実機参考値）</span>
            </div>
            <div className="readout__grid mono">
              <div>
                <span>OUTPUT</span>
                <b>{motor.powerKw.toFixed(2)} kW</b>
              </div>
              <div>
                <span>TORQUE</span>
                <b>{motor.torqueNm} N·m</b>
              </div>
              <div>
                <span>AIR</span>
                <b>{air ? `${air} L/min` : '—'}</b>
              </div>
              <div>
                <span>ANIM</span>
                <b className="c-amber">{liveRpm.toFixed(1)} rpm</b>
              </div>
            </div>
          </div>

          <div className="ctl-group">
            <div className="ctl-label mono">
              PLAYBACK SPEED <Badge tag="demo" compact />
            </div>
            <div className="slider">
              <input
                type="range"
                min={0}
                max={SLOW_STEPS.length - 1}
                step={1}
                value={slowIdx}
                onChange={(e) => setSlowIdx(+e.target.value)}
                aria-label="スロー再生倍率"
                aria-valuetext={`1/${slowN} スロー`}
              />
              <div className="slider__val mono">
                ×1/{slowN}
                <small>表示 {(rpm / slowN).toFixed(1)} rpm · 1回転 {visPeriodS.toFixed(2)} s</small>
              </div>
            </div>
            {slowN <= 2 && <p className="ctl-note ctl-note--warn">低倍率では画面のフレームレートより速く回るため、羽根が止まって見えたり逆に見えることがあります（ストロボ効果）。</p>}
          </div>

          <div className="transport" role="group" aria-label="回転操作">
            <button type="button" className={`btn ${sim.running ? 'btn--stop' : 'btn--primary'}`} onClick={() => sim.set({ running: !sim.running, paused: false })}>
              {sim.running ? <Square size={15} /> : <Play size={15} />} {sim.running ? 'STOP' : 'START'}
            </button>
            <button type="button" className="btn btn--ghost" disabled={!sim.running} onClick={() => sim.set({ paused: !sim.paused })}>
              <Pause size={15} /> {sim.paused ? 'RESUME' : 'PAUSE'}
            </button>
            <button type="button" className="btn btn--ghost" onClick={resetAll} aria-label="アニメーションと設定をリセット">
              <Undo2 size={15} /> RESET
            </button>
          </div>

          <div className="ctl-group">
            <div className="ctl-label mono">
              DIRECTION <Badge tag="demo" compact />
            </div>
            <Segmented
              label="回転方向"
              size="sm"
              value={sim.direction === 1 ? 'cw' : 'ccw'}
              onChange={(v) => sim.set({ direction: v === 'cw' ? 1 : -1 })}
              options={[
                { id: 'cw', label: <><RotateCw size={13} /> CW</>, sub: '上から見て時計回り' },
                { id: 'ccw', label: <><RotateCcw size={13} /> CCW</>, sub: '上から見て反時計回り' },
              ]}
            />
            <p className="ctl-note">実機の回転方向はカタログ未記載のため、表示は確認用のデモ操作です。逆回転を実機の標準機能として示すものではありません。</p>
          </div>

          <div className="ctl-group">
            <div className="ctl-label mono">DISPLAY MODE</div>
            <Segmented
              label="表示モード"
              size="sm"
              value={structure ? 'structure' : 'normal'}
              onChange={(v) => setStructure(v === 'structure')}
              options={[
                { id: 'normal', label: <><Box size={13} /> NORMAL</>, sub: '外観' },
                { id: 'structure', label: <><Eye size={13} /> STRUCTURE</>, sub: '透視・動力伝達（概念）' },
              ]}
            />
          </div>

          <div className="ctl-group">
            <div className="ctl-label mono">GUIDES</div>
            <div className="toggles">
              <Toggle checked={guides.axis} onChange={(v) => setGuides((g) => ({ ...g, axis: v }))}>回転軸</Toggle>
              <Toggle checked={guides.arrows} onChange={(v) => setGuides((g) => ({ ...g, arrows: v }))}>回転方向の矢印</Toggle>
              <Toggle checked={guides.trail} onChange={(v) => setGuides((g) => ({ ...g, trail: v }))}>羽根の軌跡</Toggle>
              <Toggle checked={guides.dims} onChange={(v) => setGuides((g) => ({ ...g, dims: v }))}>寸法（カタログ値）</Toggle>
              <Toggle checked={guides.flow || structure} onChange={(v) => setGuides((g) => ({ ...g, flow: v }))}>動力伝達（概念図）</Toggle>
            </div>
          </div>

          <details className="ctl-group parts-vis">
            <summary className="ctl-label mono">PARTS VISIBILITY · 部品の表示/非表示</summary>
            <div className="toggles toggles--2">
              {PARTS.map((p) => (
                <Toggle key={p.id} checked={!hidden[p.id]} onChange={(v) => setHidden((h) => ({ ...h, [p.id]: !v }))}>
                  {p.name}
                </Toggle>
              ))}
            </div>
          </details>
        </div>
      </div>
    </section>
  )
}
