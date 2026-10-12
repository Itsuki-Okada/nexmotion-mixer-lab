import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { Pause, Play, RefreshCw, Ruler, Zap } from 'lucide-react'
import { OP_POINTS, PRODUCTS, airFor, productById, rpmFor, type MotorType, type OpPoint, type Product } from '../data/products'
import { useSim, useTicker } from '../hooks/useSim'
import { useMedia } from '../hooks/useMedia'
import { frameOf } from '../three/layout'
import type { RotationSim } from '../sim/rotation'
import { MixerView } from './MixerView'
import { Badge, Segmented, SectionHead, Suit, Toggle } from './ui'

const SLOW = 1 / 20
type Slot = { pid: Product['id']; motorId: MotorType['id'] }
const DEFAULT_SLOTS: Slot[] = [
  { pid: 'axis08', motorId: 'B' },
  { pid: 'axis10', motorId: 'B' },
  { pid: 'axis15', motorId: 'B' },
]

interface Row {
  key: string
  label: string
  unit?: string
  tag: 'catalog' | 'nodata'
  values: (number | string | null)[]
  numeric?: boolean
  render?: (i: number) => ReactNode
  group: string
}

export function Compare() {
  const mobile = useMedia('(max-width: 900px)')
  const [slots, setSlots] = useState<Slot[]>(DEFAULT_SLOTS)
  const [op, setOp] = useState<OpPoint>('noload06')
  const [active, setActive] = useState(1)
  const [sameScale, setSameScale] = useState(true)
  const sims = [useSim({ slowMotion: SLOW }), useSim({ slowMotion: SLOW }), useSim({ slowMotion: SLOW })]
  useTicker(8)

  const products = slots.map((s) => productById(s.pid))
  const motors = slots.map((s, i) => products[i].motors.find((m) => m.id === s.motorId) ?? products[i].motors[0])
  const rpms = motors.map((m) => rpmFor(m, op))

  useEffect(() => {
    sims.forEach((s, i) => s.set({ rpm: rpms[i] }))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rpms.join(',')])

  const shared = useMemo(() => {
    // frame of the largest model in the comparison → identical camera for every column
    const fs = products.map((p) => frameOf(p))
    return fs.reduce((a, b) => (b.radius > a.radius ? b : a))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slots.map((s) => s.pid).join()])

  const syncStart = () => {
    sims.forEach((s) => {
      s.angle = 0
      s.visualRpm = 0
      s.set({ running: true, paused: false })
    })
  }
  const stopAll = () => sims.forEach((s) => s.set({ running: false, paused: false }))
  const resetAll = () => {
    sims.forEach((s) => s.reset())
    setSlots(DEFAULT_SLOTS)
    setOp('noload06')
    setActive(1)
    setSameScale(true)
  }
  const anyRunning = sims.some((s) => s.running)

  const setSlot = (i: number, patch: Partial<Slot>) => setSlots((ss) => ss.map((s, k) => (k === i ? { ...s, ...patch } : s)))

  const rows: Row[] = [
    { group: '回転・出力（選択中のモーター）', key: 'rpm', label: `回転数（${OP_POINTS.find((o) => o.id === op)!.label}）`, unit: 'rpm', tag: 'catalog', numeric: true, values: rpms },
    { group: '回転・出力（選択中のモーター）', key: 'rpmMax', label: '最大出力時回転数', unit: 'rpm', tag: 'catalog', numeric: true, values: motors.map((m) => m.rpmAtMaxOutput) },
    { group: '回転・出力（選択中のモーター）', key: 'rpmFree', label: '自由回転数', unit: 'rpm', tag: 'catalog', numeric: true, values: motors.map((m) => m.rpmFree) },
    { group: '回転・出力（選択中のモーター）', key: 'kw', label: '出力', unit: 'kW', tag: 'catalog', numeric: true, values: motors.map((m) => m.powerKw) },
    { group: '回転・出力（選択中のモーター）', key: 'nm', label: 'トルク', unit: 'N·m', tag: 'catalog', numeric: true, values: motors.map((m) => m.torqueNm) },
    { group: 'エアー', key: 'air', label: 'エアー消費量（最大）', unit: 'L/min', tag: 'catalog', numeric: true, values: products.map((p) => p.maxAirLpm) },
    { group: 'エアー', key: 'airOp', label: 'エアー消費量（選択条件・無負荷）', unit: 'L/min', tag: 'catalog', numeric: true, values: motors.map((m) => airFor(m, op)) },
    { group: 'エアー', key: 'mpa', label: 'エアー圧力（最大）', unit: 'MPa', tag: 'catalog', numeric: true, values: products.map((p) => p.maxPressureMPa) },
    { group: '構成', key: 'shaft', label: 'シャフト（φ × 長さ）', unit: 'mm', tag: 'catalog', values: products.map((p) => `φ${p.shaft.diameterMm} × ${p.shaft.lengthMm}`) },
    { group: '構成', key: 'prop', label: '撹拌羽根', tag: 'catalog', values: products.map((p) => p.propeller.label) },
    { group: '構成', key: 'fix', label: 'シャフト固定', tag: 'catalog', values: products.map((p) => p.shaftFixing.label) },
    { group: '構成', key: 'stand', label: '標準スタンド', tag: 'catalog', values: products.map((p) => p.stand.label) },
    { group: '構成', key: 'motors', label: '選択可能なモーター', tag: 'catalog', values: products.map((p) => p.motors.map((m) => m.id).join(' / ')) },
    { group: '寸法（図面・アーム式）', key: 'height', label: '本体高さ（図面：下端〜モーター上端、配管部除く）', unit: 'mm', tag: 'catalog', numeric: true, values: products.map((p) => p.drawing.totalHeightMm) },
    { group: '寸法（図面・アーム式）', key: 'armL', label: 'アーム全長', unit: 'mm', tag: 'catalog', numeric: true, values: products.map((p) => p.arm.lengthMm) },
    { group: '寸法（図面・アーム式）', key: 'armD', label: 'アーム径', unit: 'mm', tag: 'catalog', numeric: true, values: products.map((p) => p.arm.diameterMm) },
    { group: '用途', key: 'vol', label: '液量の目安（カタログの液量バー）', tag: 'catalog', values: products.map((p) => p.volumeBand.label) },
    { group: '用途', key: 'mount', label: '取付方法 アーム / クランプ / ヘルール / フランジ', tag: 'catalog', values: products.map((p) => Object.values(p.mounting).join()), render: (i) => <span className="suits">{Object.values(products[i].mounting).map((v, k) => <Suit key={k} v={v} />)}</span> },
    { group: '用途', key: 'use', label: '混合 / 沈降防止 / 高粘度 / 分散 / 乳化', tag: 'catalog', values: products.map((p) => Object.values(p.suitability).join()), render: (i) => <span className="suits">{Object.values(products[i].suitability).map((v, k) => <Suit key={k} v={v} />)}</span> },
    { group: '材質', key: 'red', label: '減速機材質', tag: 'catalog', values: products.map((p) => p.reducerMaterial) },
    { group: '材質', key: 'wet', label: 'シャフト・プロペラ標準材質', tag: 'catalog', values: products.map((p) => p.shaft.material) },
    { group: 'カタログ未確認', key: 'weight', label: '重量', tag: 'nodata', values: [null, null, null] },
    { group: 'カタログ未確認', key: 'dir', label: '回転方向', tag: 'nodata', values: [null, null, null] },
    { group: 'カタログ未確認', key: 'ratio', label: '減速比', tag: 'nodata', values: [null, null, null] },
  ]

  const groups = [...new Set(rows.map((r) => r.group))]

  return (
    <section className="section compare" id="compare" aria-labelledby="compare-title">
      <SectionHead index="02" kicker="PRODUCT COMPARISON" title="Same physics. Different scale." ja="3モデルを同じ条件で並べ、動きと仕様の違いを確認する">
        <p>回転数・トルク・出力は異なる物理量のため、総合スコアや優劣の判定は行いません。各行のバーは、その行の中での相対的な大きさだけを示します。</p>
      </SectionHead>

      <div className="cmp-bar panel">
        <div className="cmp-bar__group">
          <span className="ctl-label mono">CONDITION</span>
          <Segmented label="比較条件" size="sm" value={op} onChange={setOp} options={OP_POINTS.map((o) => ({ id: o.id, label: o.short }))} />
        </div>
        <div className="cmp-bar__group">
          <Toggle checked={sameScale} onChange={setSameScale}>
            <Ruler size={13} /> 同一縮尺で表示
          </Toggle>
        </div>
        <div className="cmp-bar__group cmp-bar__actions">
          <button type="button" className="btn btn--primary" onClick={syncStart}>
            <Zap size={15} /> SYNC START
          </button>
          <button type="button" className="btn btn--ghost" onClick={stopAll} disabled={!anyRunning}>
            STOP ALL
          </button>
          <button type="button" className="btn btn--ghost" onClick={resetAll}>
            <RefreshCw size={14} /> RESET
          </button>
        </div>
      </div>

      {mobile && (
        <div className="cmp-tabs" role="tablist" aria-label="表示するモデル">
          {products.map((p, i) => (
            <button key={i} role="tab" aria-selected={active === i} type="button" className={`cmp-tab ${active === i ? 'is-on' : ''}`} onClick={() => setActive(i)}>
              <span className="mono">{String.fromCharCode(65 + i)}</span> {p.name}
            </button>
          ))}
        </div>
      )}

      <div className="cmp-cols">
        {products.map((p, i) =>
          mobile && active !== i ? null : (
            <CompareCard
              key={i}
              index={i}
              product={p}
              motor={motors[i]}
              rpm={rpms[i]}
              sim={sims[i]}
              active={active === i}
              onActivate={() => setActive(i)}
              onProduct={(pid) => setSlot(i, { pid })}
              onMotor={(motorId) => setSlot(i, { motorId })}
              framing={sameScale ? shared : undefined}
            />
          ),
        )}
      </div>

      <div className="matrix panel" role="table" aria-label="仕様比較表">
        <div className="matrix__head" role="row">
          <div className="matrix__label mono" role="columnheader">
            SPEC
          </div>
          {products.map((p, i) => (
            <div key={i} role="columnheader" className={`matrix__col mono ${active === i ? 'is-active' : ''}`}>
              <button type="button" onClick={() => setActive(i)}>
                <span className="c-dim">{String.fromCharCode(65 + i)}</span> {p.name}
                <small>MOTOR {motors[i].id}</small>
              </button>
            </div>
          ))}
        </div>
        {groups.map((g) => (
          <div key={g} className="matrix__group" role="rowgroup">
            <div className="matrix__gtitle mono">{g}</div>
            {rows
              .filter((r) => r.group === g)
              .map((r) => (
                <MatrixRow key={r.key} row={r} active={active} />
              ))}
          </div>
        ))}
        <p className="matrix__foot">
          単位はカタログ表記（rpm / kW / N·m / L/min / MPa / mm）のまま変換せずに表示。差異がある行は左端にアンバーのラインで示します。液量・用途の◯△×はカタログのアイコン表示を記号化したものです。
        </p>
      </div>
    </section>
  )
}

function MatrixRow({ row, active }: { row: Row; active: number }) {
  const vals = row.values
  const nonNull = vals.filter((v) => v !== null)
  const common = row.tag !== 'nodata' && nonNull.length === vals.length && nonNull.every((v) => v === nonNull[0])
  const max = row.numeric ? Math.max(...(vals.filter((v) => typeof v === 'number') as number[])) : 0
  return (
    <div className={`matrix__row ${common ? 'is-common' : row.tag === 'nodata' ? 'is-nodata' : 'is-diff'}`} role="row">
      <div className="matrix__label" role="rowheader">
        <span>{row.label}</span>
        {common && <span className="pill">共通</span>}
        {row.tag === 'nodata' && <Badge tag="nodata" compact />}
      </div>
      {vals.map((v, i) => (
        <div key={i} className={`matrix__cell ${active === i ? 'is-active' : ''}`} role="cell">
          {row.render ? (
            row.render(i)
          ) : v === null ? (
            <span className="c-dim mono">{row.tag === 'nodata' ? 'カタログ未確認' : 'データなし'}</span>
          ) : (
            <>
              <span className="mono matrix__val">
                {typeof v === 'number' ? v.toLocaleString('en-US') : v}
                {row.unit && typeof v === 'number' && <small> {row.unit}</small>}
              </span>
              {row.numeric && typeof v === 'number' && !common && (
                <span className="bar" aria-hidden="true">
                  <span style={{ width: `${(v / max) * 100}%` }} />
                </span>
              )}
            </>
          )}
        </div>
      ))}
    </div>
  )
}

function CompareCard({
  index, product, motor, rpm, sim, active, onActivate, onProduct, onMotor, framing,
}: {
  index: number
  product: Product
  motor: MotorType
  rpm: number
  sim: RotationSim
  active: boolean
  onActivate: () => void
  onProduct: (id: Product['id']) => void
  onMotor: (id: MotorType['id']) => void
  framing?: ReturnType<typeof frameOf>
}) {
  const live = Math.abs(sim.visualRpm)
  return (
    <article className={`cmp-card panel ${active ? 'is-active' : ''}`} onPointerDown={onActivate} aria-label={`${product.name} 比較カード`}>
      <header className="cmp-card__head">
        <span className="cmp-card__idx mono">{String.fromCharCode(65 + index)}</span>
        <select className="select" value={product.id} onChange={(e) => onProduct(e.target.value as Product['id'])} aria-label={`スロット${index + 1}のモデル`}>
          {PRODUCTS.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
        <span className="cmp-card__tag">{product.taglineJa}</span>
      </header>
      <MixerView product={product} sim={sim} preset="iso" framing={framing} showArrows showAxis showTrail className="cmp-card__stage" label={`${product.name} 比較用3Dビュー`} />
      <div className="cmp-card__foot">
        <div className="cmp-card__rpm">
          <span className="mono c-dim">CATALOG</span>
          <b className="mono">{rpm.toLocaleString('en-US')}</b>
          <span className="mono">rpm</span>
        </div>
        <div className="cmp-card__rpm">
          <span className="mono c-dim">ANIM ×1/20</span>
          <b className="mono c-amber">{live.toFixed(1)}</b>
          <span className="mono">rpm</span>
        </div>
        <button type="button" className="icon-btn icon-btn--lg" onClick={() => sim.set({ running: !sim.running, paused: false })} aria-label={sim.running ? `${product.name} を停止` : `${product.name} を再生`}>
          {sim.running ? <Pause size={16} /> : <Play size={16} />}
        </button>
      </div>
      <div className="cmp-card__motors">
        <Segmented label="モーター" size="sm" value={motor.id} onChange={onMotor} options={product.motors.map((m) => ({ id: m.id, label: m.id, sub: `${m.torqueNm}N·m` }))} />
      </div>
    </article>
  )
}
