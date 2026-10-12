import { useMemo } from 'react'
import { ArrowDown, ArrowRight } from 'lucide-react'
import { productById } from '../data/products'
import { useSim, useTicker } from '../hooks/useSim'
import { isCoarsePointer, prefersReducedMotion } from '../hooks/env'
import { frameOf } from '../three/layout'
import { MixerView } from './MixerView'
import { Badge } from './ui'

const HERO = productById('axis10')
const MOTOR = HERO.motors[1] // Motor B
const SLOW = 1 / 20

export function Hero() {
  const reduced = useMemo(() => prefersReducedMotion(), [])
  const coarse = useMemo(() => isCoarsePointer(), [])
  const sim = useSim({ rpm: MOTOR.noLoad.p06.rpm, slowMotion: reduced ? 1 / 80 : SLOW, running: true })
  useTicker(10)
  const deg = (((-sim.angle * 180) / Math.PI) % 360 + 360) % 360
  const framing = useMemo(() => {
    const f = frameOf(HERO)
    return { target: [f.target[0] - 0.02, f.target[1] + 0.02, f.target[2]] as [number, number, number], radius: f.radius * 0.96 }
  }, [])

  return (
    <section className="hero" id="top" aria-labelledby="hero-title">
      <div className="hero__bg" aria-hidden="true" />
      <div className="hero__stage">
        <MixerView
          product={HERO}
          sim={sim}
          preset="hero"
          framing={framing}
          autoRotate
          enableZoom={false}
          interactiveCamera={!coarse}
          showTrail
          showAxis
          label="ヒーロー：回転中のエアーモーター撹拌機 3Dモデル"
        />
      </div>

      <div className="hero__hud mono" aria-hidden="true">
        <span className="hud-corner hud-corner--tl" />
        <span className="hud-corner hud-corner--tr" />
        <span className="hud-corner hud-corner--bl" />
        <span className="hud-corner hud-corner--br" />
      </div>

      <div className="hero__copy">
        <p className="eyebrow mono">
          <span className="dot dot--live" /> NEXMOTION INDUSTRIAL · MOTION LAB
        </p>
        <h1 id="hero-title" className="hero__title">
          ROTATION,
          <br />
          <span className="grad">REIMAGINED.</span>
        </h1>
        <p className="hero__ja">機構を、動きで理解する。</p>
        <p className="hero__lead">
          圧縮空気で回るオイルレス・エアーモーター撹拌機。3つのモデルの構造と回転を、3Dで見て、動かして、比べる。
        </p>
        <div className="hero__cta">
          <a className="btn btn--primary" href="#lab">
            INTERACTIVE LAB <ArrowRight size={16} />
          </a>
          <a className="btn btn--ghost" href="#compare">
            3モデルを比較
          </a>
        </div>
      </div>

      <aside className="hero__readout mono" aria-label="ヒーロー表示中のモデル情報">
        <div className="ro-row">
          <span className="ro-k">MODEL</span>
          <span className="ro-v">{HERO.name} · MOTOR {MOTOR.id}</span>
        </div>
        <div className="ro-row">
          <span className="ro-k">REF. SPEED</span>
          <span className="ro-v">
            <b>{MOTOR.noLoad.p06.rpm}</b> rpm <Badge tag="catalog" compact />
          </span>
        </div>
        <div className="ro-sub">無負荷・0.6 MPa 時の参考回転数</div>
        <div className="ro-row">
          <span className="ro-k">PLAYBACK</span>
          <span className="ro-v">
            ×1/{Math.round(1 / sim.slowMotion)} SLOW <Badge tag="demo" compact />
          </span>
        </div>
        <div className="ro-row">
          <span className="ro-k">θ OUTPUT</span>
          <span className="ro-v">{deg.toFixed(1).padStart(5, '0')}°</span>
        </div>
        <div className="ro-bar">
          <span style={{ transform: `rotate(${deg}deg)` }} />
        </div>
      </aside>

      <a className="hero__scroll mono" href="#legend" aria-label="次のセクションへスクロール">
        SCROLL <ArrowDown size={14} />
      </a>
    </section>
  )
}
