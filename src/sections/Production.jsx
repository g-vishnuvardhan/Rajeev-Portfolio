import { useRef } from 'react'
import { production } from '../data/content'
import { resolveSrc } from '../lib/placeholder'
import { useGsap, gsap } from '../lib/useGsap'
import { useEnv } from '../lib/env'

export default function Production() {
  const root = useRef()
  const env = useEnv()

  useGsap(() => {
    gsap.from('.production .section-head', {
      y: 36, opacity: 0, duration: 1, ease: 'expo.out',
      scrollTrigger: { trigger: root.current, start: 'top 82%' },
    })
    gsap.utils.toArray('.prod-card').forEach((el, i) => {
      gsap.from(el, {
        clipPath: 'inset(100% 0 0 0 round 14px)',
        opacity: 0,
        duration: 1.25,
        delay: (i % 2) * 0.1,
        ease: 'expo.out',
        scrollTrigger: { trigger: el, start: 'top 86%' },
      })
      gsap.fromTo(el.querySelector('img'), { yPercent: -7 }, {
        yPercent: 7, ease: 'none',
        scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true },
      })
    })
  }, root)

  const handleMove = (e) => {
    if (env.mobile || env.reduced) return
    const card = e.currentTarget
    const rect = card.getBoundingClientRect()
    const x = (e.clientX - rect.left) / rect.width
    const y = (e.clientY - rect.top) / rect.height
    card.style.setProperty('--mx', `${x * 100}%`)
    card.style.setProperty('--my', `${y * 100}%`)
    gsap.to(card, {
      rotateX: (0.5 - y) * 5,
      rotateY: (x - 0.5) * 6,
      transformPerspective: 900,
      duration: 0.45,
      ease: 'power2.out',
    })
  }

  const handleLeave = (e) => {
    if (env.mobile || env.reduced) return
    gsap.to(e.currentTarget, { rotateX: 0, rotateY: 0, duration: 0.7, ease: 'elastic.out(1, 0.5)' })
  }

  return (
    <section id="production" className="production" ref={root}>
      <header className="section-head">
        <h2>Production experience</h2>
      </header>
      <div className="prod-grid">
        {production.map((p, i) => (
          <article
            className={`prod-card ${i % 3 === 0 ? 'is-wide' : ''}`}
            key={p.title}
            onMouseMove={handleMove}
            onMouseLeave={handleLeave}
          >
            <img src={resolveSrc(p.src, i + 1, i % 3 === 0 ? 1.7 : 0.85, `${p.title} — photograph placeholder`)} alt="" loading="lazy" />
            <div className="prod-spotlight" aria-hidden="true" />
            <div className="prod-text">
              <span className="prod-num">{String(i + 1).padStart(2, '0')}</span>
              <h3>{p.title}</h3>
              <p>{p.text}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
