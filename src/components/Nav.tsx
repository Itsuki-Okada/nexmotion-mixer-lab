import { useEffect, useState } from 'react'
import { BrandMark } from './Brand'

const LINKS = [
  ['#lab', 'LAB'],
  ['#compare', 'COMPARE'],
  ['#mechanism', 'MECHANISM'],
  ['#specs', 'SPECS'],
] as const

export function Nav() {
  const [scrolled, setScrolled] = useState(false)
  const [current, setCurrent] = useState('')
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 24)
    on()
    window.addEventListener('scroll', on, { passive: true })
    const io = new IntersectionObserver(
      (es) => es.forEach((e) => e.isIntersecting && setCurrent('#' + e.target.id)),
      { rootMargin: '-45% 0px -50% 0px' },
    )
    LINKS.forEach(([h]) => {
      const el = document.querySelector(h)
      if (el) io.observe(el)
    })
    return () => {
      window.removeEventListener('scroll', on)
      io.disconnect()
    }
  }, [])
  return (
    <nav className={`nav ${scrolled ? 'is-scrolled' : ''}`} aria-label="メインナビゲーション">
      <a className="nav__brand" href="#top" aria-label="NEXMOTION INDUSTRIAL トップへ">
        <BrandMark />
        <span className="nav__name">
          NEXMOTION <span>INDUSTRIAL</span>
        </span>
      </a>
      <div className="nav__links">
        {LINKS.map(([h, l]) => (
          <a key={h} href={h} className={current === h ? 'is-on' : ''}>
            {l}
          </a>
        ))}
      </div>
      <span className="nav__demo mono" title="架空ブランドによる独立したコンセプトデモです">
        CONCEPT DEMO
      </span>
    </nav>
  )
}
