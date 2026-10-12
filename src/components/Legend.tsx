import { Badge, Reveal } from './ui'

export function Legend() {
  return (
    <section className="legend" id="legend" aria-label="表示データの区分">
      <Reveal className="legend__inner">
        <div className="legend__title mono">DATA INTEGRITY · 表示データの区分</div>
        <ul className="legend__list">
          <li>
            <Badge tag="catalog" compact />
            <span>参考資料（製品カタログ）に記載された値。仕様・回転数・寸法はすべてこの区分のみ。</span>
          </li>
          <li>
            <Badge tag="drawing" compact />
            <span>カタログ寸法図を記載寸法で縮尺換算した比率。3Dモデルの形づくりにのみ使用し、仕様としては表示しない。</span>
          </li>
          <li>
            <Badge tag="concept" compact />
            <span>資料で確認できない形状・内部構造の視覚表現。実機のCADモデルではない。</span>
          </li>
          <li>
            <Badge tag="demo" compact />
            <span>アニメーション速度・逆回転など、理解のためのデモ操作。実機の機能や実測値ではない。</span>
          </li>
          <li>
            <Badge tag="nodata" compact />
            <span>カタログで確認できなかった項目。推測で埋めずにそのまま表示。</span>
          </li>
        </ul>
      </Reveal>
    </section>
  )
}
