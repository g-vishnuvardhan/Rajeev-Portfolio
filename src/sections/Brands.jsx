import { useRef } from 'react'
import { brands } from '../data/content'
import { useGsap, gsap, ScrollTrigger } from '../lib/useGsap'

export default function Brands() {
  const root = useRef()
  const half = Math.ceil(brands.length / 2)
  const rows = [brands.slice(0, half), brands.slice(half)]

  useGsap(() => {
    gsap.from('.brands .section-head', {
      y: 36, opacity: 0, duration: 1, ease: 'expo.out',
      scrollTrigger: { trigger: root.current, start: 'top 82%' },
    })

    // Continuous Lusion-style infinite marquee boosted by scroll velocity
    const tweens = gsap.utils.toArray('.brand-row').map((row, i) => {
      const dir = i % 2 === 0 ? -50 : 0
      const end = i % 2 === 0 ? 0 : -50
      return gsap.fromTo(
        row,
        { xPercent: dir },
        { xPercent: end, duration: 24 + i * 4, repeat: -1, ease: 'none' }
      )
    })

    ScrollTrigger.create({
      trigger: root.current,
      start: 'top bottom',
      end: 'bottom top',
      onUpdate: (self) => {
        const boost = 1 + Math.min(Math.abs(self.getVelocity()) / 450, 3.5)
        tweens.forEach((tw) => {
          gsap.to(tw, { timeScale: boost, duration: 0.25, overwrite: 'auto' })
          gsap.to(tw, { timeScale: 1, duration: 0.9, delay: 0.15, overwrite: false })
        })
      },
    })
  }, root)

  return (
    <section id="brands" className="brands" ref={root}>
      <header className="section-head">
        <h2>Selected brand & commercial experience</h2>
      </header>
      <div className="brand-track" aria-hidden="true">
        {rows.map((r, i) => (
          <div className="brand-row" key={i}>
            {[...r, ...r, ...r, ...r].map((b, k) => (
              <span key={k}>{b}</span>
            ))}
          </div>
        ))}
      </div>
      <ul className="sr-only">
        {brands.map((b) => <li key={b}>{b}</li>)}
      </ul>
    </section>
  )
}
