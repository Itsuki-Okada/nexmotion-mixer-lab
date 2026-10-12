import { Nav } from './components/Nav'
import { Hero } from './components/Hero'
import { Legend } from './components/Legend'
import { Lab } from './components/Lab'
import { Compare } from './components/Compare'
import { Mechanism } from './components/Mechanism'
import { Specs } from './components/Specs'
import { Footer } from './components/Footer'

export default function App() {
  return (
    <>
      <a className="skip" href="#lab">
        メインコンテンツへスキップ
      </a>
      <Nav />
      <main>
        <Hero />
        <Legend />
        <Lab />
        <Compare />
        <Mechanism />
        <Specs />
      </main>
      <Footer />
    </>
  )
}
