import { useEffect, useMemo, useState } from 'react'
import { Layers, Pause, Play, ScanEye } from 'lucide-react'
import { PRODUCTS, productById, type Product } from '../data/products'
import { PARTS, partById, type PartId } from '../data/parts'
import { useSim } from '../hooks/useSim'
import { MixerView } from './MixerView'
import { frameOf, layoutOf } from '../three/layout'
import type { Framing } from '../three/Stage'
import { Badge, Segmented, SectionHead, Toggle } from './ui'

export function Mechanism() {
  const [pid, setPid] = useState<Product['id']>('axis15')
  const product = productById(pid)
  const sim = useSim({ rpm: product.motors[1].noLoad.p06.rpm, slowMotion: 1 / 40, running: true })
  useEffect(() => sim.set({ rpm: product.motors[1].noLoad.p06.rpm }), [sim, product])
  const [selected, setSelected] = useState<PartId>('reducer')
  const [explode, setExplode] = useState(0.55)
  const [xray, setXray] = useState(true)
  const info = partById(selected)

  // camera follows the selected part (head cluster / shaft / propeller / whole stand)
  const framing = useMemo<Framing>(() => {
    const L = layoutOf(product)
    if (selected === 'stand' || selected === 'shaft') return frameOf(product)
    if (selected === 'propeller') {
      const y = L.propY - 200 * explode
      return { target: [0, y / 1000, 0], radius: Math.max(L.propR * 2.6, 140) / 1000 }
    }
    const top = L.top + 190 * explode
    const bottom = -60 - 60 * explode
    const right = L.armTip + 110 * explode
    const left = -L.edge - 60 * explode - 60
    return {
      target: [(left + right) / 2000, (top + bottom) / 2000, 0],
      radius: (Math.max(top - bottom, right - left) / 2000) * 1.08,
    }
  }, [product, selected, explode])

  return (
    <section className="section mech" id="mechanism" aria-labelledby="mech-title">
      <SectionHead index="03" kicker="INSIDE THE MECHANISM" title="Every part, explained." ja="部品を選んで、役割・材質・形状の根拠を確認する">
        <p>
          内部構造はカタログに図示されていないため創作しません。減速機の透視表示は「タイミングベルト式・オイル不要」という記載に基づく<b>概念図</b>で、プーリー径や配置は実機と異なります。
        </p>
      </SectionHead>

      <div className="mech__grid">
        <div className="mech__list panel">
          <Segmented label="モデル選択" size="sm" value={pid} onChange={setPid} options={PRODUCTS.map((p) => ({ id: p.id, label: p.name }))} />
          <ol className="parts" aria-label="部品一覧">
            {PARTS.map((p, i) => (
              <li key={p.id}>
                <button type="button" className={`parts__btn ${selected === p.id ? 'is-on' : ''}`} onClick={() => setSelected(p.id)} aria-pressed={selected === p.id}>
                  <span className="parts__no mono">{String(i + 1).padStart(2, '0')}</span>
                  <span className="parts__name">
                    {p.name}
                    <small className="mono">{p.en}</small>
                  </span>
                  {p.rotates && <span className="pill pill--cyan">ROT</span>}
                </button>
              </li>
            ))}
          </ol>
        </div>

        <div className="mech__view panel">
          <MixerView
            product={product}
            sim={sim}
            preset="iso"
            framing={framing}
            highlight={selected}
            focusMode
            xray={xray}
            explode={explode}
            showTags
            interactive
            onSelect={setSelected}
            className="mech__stage"
            label={`${product.name} 構造解説3Dビュー`}
          />
          <div className="mech__controls">
            <label className="slider slider--inline">
              <span className="ctl-label mono">
                <Layers size={13} /> EXPLODE
              </span>
              <input type="range" min={0} max={1} step={0.01} value={explode} onChange={(e) => setExplode(+e.target.value)} aria-label="分解表示の量" />
              <span className="mono slider__num">{Math.round(explode * 100)}%</span>
            </label>
            <Toggle checked={xray} onChange={setXray}>
              <ScanEye size={13} /> 透視（概念）
            </Toggle>
            <button type="button" className="icon-btn icon-btn--lg" onClick={() => sim.set({ running: !sim.running, paused: false })} aria-label={sim.running ? '回転を停止' : '回転を開始'}>
              {sim.running ? <Pause size={16} /> : <Play size={16} />}
            </button>
          </div>
        </div>

        <article className="mech__info panel" aria-live="polite">
          <div className="mono mech__en">{info.en}</div>
          <h3 className="mech__name">{info.name}</h3>
          <div className="mech__tags">
            {info.rotates ? <span className="pill pill--cyan">回転部（出力軸と一体）</span> : <span className="pill">静止部</span>}
            <span className="mech__src">
              形状 <Badge tag={info.shapeSource} compact />
            </span>
          </div>
          <p className="mech__role">{info.role(product)}</p>
          <dl className="mech__dl">
            <dt>材質</dt>
            <dd>{info.material(product).replace('材質：', '').replace('標準材質：', '')}</dd>
            <dt>出典</dt>
            <dd>参考カタログ {product.catalogPages}（写真・寸法図・仕様欄）</dd>
          </dl>
          <div className="mech__flow">
            <div className="ctl-label mono">POWER PATH · 概念</div>
            <ol>
              {(['inlet', 'motor', 'reducer', 'fixing', 'shaft', 'propeller'] as PartId[]).map((id) => (
                <li key={id} className={selected === id ? 'is-on' : ''}>
                  <button type="button" onClick={() => setSelected(id)}>
                    {partById(id).name}
                  </button>
                </li>
              ))}
            </ol>
          </div>
        </article>
      </div>
    </section>
  )
}
