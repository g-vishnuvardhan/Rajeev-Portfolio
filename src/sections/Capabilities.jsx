import { useRef, useState } from 'react'
import { capabilities } from '../data/content'
import { resolveSrc } from '../lib/placeholder'
import { useGsap, gsap } from '../lib/useGsap'
import { useEnv } from '../lib/env'
import { RollText } from '../components/Magnetic'

export default function Capabilities() {
  const env = useEnv()
  const root = useRef()
  const preview = useRef()
  const [active, setActive] = useState(null)

  useGsap(() => {
    gsap.from('.capabilities .section-head', {
      y: 36, opacity: 0, duration: 1, ease: 'expo.out',
      scrollTrigger: { trigger: root.current, start: 'top 82%' },
    })
    gsap.from('.cap-list li', {
      y: 28, opacity: 0, duration: 0.85, stagger: 0.08, ease: 'power3.out',
      scrollTrigger: { trigger: '.cap-list', start: 'top 84%' },
    })

    if (env.mobile) return
    const x = gsap.quickTo(preview.current, 'x', { duration: 0.45, ease: 'power3.out' })
    const y = gsap.quickTo(preview.current, 'y', { duration: 0.45, ease: 'power3.out' })
    const rot = gsap.quickTo(preview.current, 'rotation', { duration: 0.55, ease: 'power2.out' })
    let lx = 0
    const move = (e) => {
      const vx = e.clientX - lx
      lx = e.clientX
      x(e.clientX + 32)
      y(e.clientY - 108)
      rot(Math.max(-8, Math.min(8, vx * 0.35)))
    }
    const el = root.current
    el.addEventListener('mousemove', move)
    return () => el && el.removeEventListener('mousemove', move)
  }, root, [env.mobile])

  return (
    <section id="capabilities" className="capabilities" ref={root}>
      <header className="section-head">
        <h2>Visual & creative capabilities</h2>
      </header>
      <ul className="cap-list" onMouseLeave={() => setActive(null)}>
        {capabilities.map((c, i) => (
          <li key={c.title} onMouseEnter={() => setActive(i)}>
            <span className="cap-title" tabIndex={0} onFocus={() => setActive(i)} onBlur={() => setActive(null)}>
              <span className="cap-index">{String(i + 1).padStart(2, '0')}</span>
              <RollText text={c.title} />
            </span>
            <img className="cap-inline" src={resolveSrc(c.src, i + 2, 1.5, `${c.title} placeholder`)} alt="" loading="lazy" />
          </li>
        ))}
      </ul>
      <div className={`cap-preview ${active !== null ? 'is-on' : ''}`} ref={preview} aria-hidden="true">
        {active !== null && <img src={resolveSrc(capabilities[active].src, active + 2, 1.5, `${capabilities[active].title} placeholder`)} alt="" />}
      </div>
    </section>
  )
}
