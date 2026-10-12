import { useState } from 'react'
import { PRODUCTS, SERIES_FACTS, productById, type Product } from '../data/products'
import { Badge, Reveal, Segmented, SectionHead, Suit } from './ui'

const NOT_IN_CATALOG = ['製品重量', '回転方向', '減速比・プーリー径', 'スタンド支柱の高さ・ベース寸法', 'プロペラのピッチ角・断面形状', 'エアーモーター内部構造']

export function Specs() {
  const [pid, setPid] = useState<Product['id']>('axis10')
  const p = productById(pid)
  return (
    <section className="section specs" id="specs" aria-labelledby="specs-title">
      <SectionHead index="04" kicker="SPECIFICATIONS" title="The numbers, sourced." ja="モデルごとの仕様一覧（すべてカタログ記載値）" />

      <div className="specs__tabs">
        <Segmented label="仕様を表示するモデル" value={pid} onChange={setPid} options={PRODUCTS.map((x) => ({ id: x.id, label: x.name, sub: x.code }))} />
      </div>

      <Reveal className="sheet panel" key={pid}>
        <header className="sheet__head">
          <div>
            <div className="mono c-cyan sheet__code">{p.code}</div>
            <h3 className="sheet__name">{p.name}</h3>
            <p className="sheet__cat">{p.category} — {p.taglineJa}</p>
          </div>
          <div className="sheet__src mono">
            SOURCE <b>CATALOG {p.catalogPages}</b>
            <Badge tag="catalog" />
          </div>
        </header>

        <div className="sheet__kpis">
          {[
            ['エアー圧力（最大）', `${p.maxPressureMPa}`, 'MPa'],
            ['エアー消費量（最大）', `${p.maxAirLpm}`, 'L/min'],
            ['シャフト', `φ${p.shaft.diameterMm} × ${p.shaft.lengthMm}`, 'mm'],
            ['撹拌羽根', p.propeller.label.replace(/ φ\d+/, ''), `φ${p.propeller.diameterMm}`],
          ].map(([k, v, u]) => (
            <div key={k} className="kpi">
              <span className="kpi__k">{k}</span>
              <span className="kpi__v mono">
                {v} <small>{u}</small>
              </span>
            </div>
          ))}
        </div>

        <div className="sheet__block">
          <h4 className="sheet__h mono">AIR MOTOR TYPES · 搭載エアーモーター</h4>
          <div className="table-wrap">
            <table className="tbl">
              <thead>
                <tr>
                  <th scope="col">TYPE</th>
                  <th scope="col">出力 kW</th>
                  <th scope="col">トルク N·m</th>
                  <th scope="col">最大出力時 rpm</th>
                  <th scope="col">自由回転数 rpm</th>
                  <th scope="col">参考 0.3 MPa<br /><small>rpm (L/min)</small></th>
                  <th scope="col">参考 0.6 MPa<br /><small>rpm (L/min)</small></th>
                </tr>
              </thead>
              <tbody>
                {p.motors.map((m) => (
                  <tr key={m.id}>
                    <th scope="row" className="mono c-cyan">{m.id}</th>
                    <td>{m.powerKw.toFixed(2)}</td>
                    <td>{m.torqueNm}</td>
                    <td>{m.rpmAtMaxOutput.toLocaleString('en-US')}</td>
                    <td>{m.rpmFree.toLocaleString('en-US')}</td>
                    <td>{m.noLoad.p03.rpm.toLocaleString('en-US')} <small>({m.noLoad.p03.airLpm})</small></td>
                    <td>{m.noLoad.p06.rpm.toLocaleString('en-US')} <small>({m.noLoad.p06.airLpm})</small></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="sheet__note">参考回転数はシャフト・プロペラ無しの無負荷状態の値（カタログ記載）。実際の回転数は液質・液量・羽根・圧力により変わります。</p>
        </div>

        <div className="sheet__cols">
          <div className="sheet__block">
            <h4 className="sheet__h mono">COMPOSITION · 構成</h4>
            <dl className="dl">
              <dt>エアーモーター材質</dt><dd>{p.motorMaterial}</dd>
              <dt>減速機材質</dt><dd>{p.reducerMaterial}</dd>
              <dt>シャフト固定</dt><dd>{p.shaftFixing.label}{p.chuckMaterial ? `（材質 ${p.chuckMaterial}）` : ''}</dd>
              <dt>シャフト・プロペラ材質</dt><dd>{p.shaft.material}（別材質 SUS316・316L、別サイズ特注可）</dd>
              <dt>標準スタンド</dt><dd>{p.stand.label}</dd>
            </dl>
          </div>
          <div className="sheet__block">
            <h4 className="sheet__h mono">DRAWING · 寸法図（{p.drawing.variantLabel}）</h4>
            <dl className="dl">
              <dt>本体高さ</dt><dd className="mono">{p.drawing.totalHeightMm} mm</dd>
              <dt>配管部（参考寸法）</dt><dd className="mono">({p.drawing.inletHeightMm}) mm</dd>
              <dt>下端〜減速機上面</dt><dd className="mono">{p.drawing.reducerTopMm} mm</dd>
              <dt>軸芯〜減速機端</dt><dd className="mono">{p.drawing.shaftToReducerEdgeMm} mm</dd>
              <dt>アーム 全長 / 径</dt><dd className="mono">{p.arm.lengthMm} mm / φ{p.arm.diameterMm}</dd>
            </dl>
          </div>
          <div className="sheet__block">
            <h4 className="sheet__h mono">APPLICATION · 用途</h4>
            <ul className="suit-list">
              {([
                ['混合', p.suitability.mixing], ['沈降防止', p.suitability.antiSettling], ['高粘度撹拌', p.suitability.highViscosity], ['分散', p.suitability.dispersion], ['乳化', p.suitability.emulsification],
                ['アーム', p.mounting.arm], ['クランプ', p.mounting.clamp], ['ヘルール', p.mounting.ferrule], ['フランジ', p.mounting.flange],
                ['セットボルト', p.fixingOptions.setbolt], ['ドリルチャック', p.fixingOptions.chuck], ['ETPブッシュ', p.fixingOptions.etp],
              ] as const).map(([k, v]) => (
                <li key={k}><Suit v={v} /> {k}</li>
              ))}
            </ul>
            <p className="sheet__note">液量の目安：{p.volumeBand.label}（液量バー）／ 選定表：{p.selectionChart}</p>
          </div>
        </div>

        <div className="sheet__cols sheet__cols--2">
          <div className="sheet__block">
            <h4 className="sheet__h mono">SERIES FACTS · シリーズ共通</h4>
            <dl className="dl">
              {SERIES_FACTS.map((f) => (
                <div key={f.k} className="dl__row">
                  <dt>{f.k}</dt>
                  <dd>{f.v} <small className="c-dim mono">{f.src}</small></dd>
                </div>
              ))}
            </dl>
          </div>
          <div className="sheet__block">
            <h4 className="sheet__h mono">NOT IN CATALOG · カタログ未確認</h4>
            <ul className="nodata-list">
              {NOT_IN_CATALOG.map((x) => (
                <li key={x}>
                  <span>{x}</span> <Badge tag="nodata" compact />
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Reveal>
    </section>
  )
}
