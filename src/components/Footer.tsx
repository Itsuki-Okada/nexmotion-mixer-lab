import { BrandMark } from './Brand'

export function Footer() {
  return (
    <footer className="footer">
      <div className="footer__top">
        <div className="footer__brand">
          <BrandMark size={28} />
          <div>
            <div className="footer__name">NEXMOTION INDUSTRIAL</div>
            <div className="footer__tag mono">ENGINEERING MOTION. VISUALIZING PERFORMANCE.</div>
          </div>
        </div>
        <nav className="footer__links mono" aria-label="フッターナビゲーション">
          <a href="#lab">LAB</a>
          <a href="#compare">COMPARE</a>
          <a href="#mechanism">MECHANISM</a>
          <a href="#specs">SPECS</a>
        </nav>
      </div>
      <div className="footer__disclaimer">
        <p className="footer__en">Independent concept demo. Fictional brand. Not an official manufacturer website.</p>
        <p>
          本サイトは架空ブランドによる独立したコンセプトデモです。実在するメーカーの公式サイトではなく、製品の販売・問い合わせ窓口もありません。
          仕様値は参考資料（市販製品カタログ）から転記したもので、モデル名・型番はデモ用の架空名称です。3Dモデルはカタログの写真・寸法図を参考にした概念モデルであり、実機のCADデータではありません。
        </p>
      </div>
      <div className="footer__bottom mono">
        <span>© NEXMOTION INDUSTRIAL (fictional) · concept demo</span>
        <span>Built with React · Three.js · React Three Fiber</span>
      </div>
    </footer>
  )
}
