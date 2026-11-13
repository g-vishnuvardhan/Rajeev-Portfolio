import { useRef, useState } from 'react'
import { expertise } from '../data/content'
import { useGsap, gsap } from '../lib/useGsap'

export default function Expertise() {
  const root = useRef()
  const [active, setActive] = useState(0)

  useGsap(() => {
    gsap.from('.expertise .section-head', {
      y: 36, opacity: 0, duration: 1, ease: 'expo.out',
      scrollTrigger: { trigger: root.current, start: 'top 82%' },
    })
    gsap.from('.exp-row', {
      opacity: 0, y: 36, duration: 0.95, stagger: 0.12, ease: 'power3.out',
      scrollTrigger: { trigger: '.exp-list', start: 'top 82%' },
    })
  }, root)

  return (
    <section id="expertise" className="expertise" ref={root}>
      <header className="section-head">
        <h2>Camera & production expertise</h2>
      </header>
      <ul className="exp-list">
        {expertise.map((e, i) => (
          <li className={`exp-row ${active === i ? 'is-active' : ''}`} key={e.title}>
            <button
              className="exp-title"
              aria-expanded={active === i}
              aria-controls={`exp-${i}`}
              onMouseEnter={() => setActive(i)}
              onFocus={() => setActive(i)}
              onClick={() => setActive(i)}
            >
              <span className="exp-index">[{String(i + 1).padStart(2, '0')}]</span>
              <span className="exp-label">{e.title}</span>
              <span className="exp-plus" aria-hidden="true">+</span>
            </button>
            <div className="exp-body" id={`exp-${i}`}>
              <div className="exp-inner">
                <p>{e.text}</p>
                <ul className="exp-chips">
                  {e.items.map((it) => (
                    <li key={it}>{it}</li>
                  ))}
                </ul>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}
