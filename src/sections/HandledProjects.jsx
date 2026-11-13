import { useRef } from 'react'
import { handledProjects } from '../data/handledProjects'
import { useGsap, gsap } from '../lib/useGsap'

export default function HandledProjects() {
  const root = useRef(null)

  useGsap(() => {
    // Section head reveal in-place
    gsap.from('.handled-projects .section-head', {
      opacity: 0,
      duration: 1.0,
      ease: 'power2.out',
      scrollTrigger: { trigger: root.current, start: 'top 82%' },
    })

    // Cards reveal in-place (no x/y movement, purely in place at their location)
    gsap.from('.client-logo-card', {
      opacity: 0,
      scale: 0.9,
      duration: 0.85,
      stagger: 0.08,
      ease: 'back.out(1.4)',
      scrollTrigger: { trigger: '.client-logos-grid', start: 'top 85%' },
    })
  }, root)

  return (
    <section id="projects" className="handled-projects" ref={root}>
      <div className="handled-ambient" aria-hidden="true" />

      <header className="section-head handled-head">
        <div className="handled-eyebrow">
          <span className="handled-badge">COMMERCIAL PORTFOLIO</span>
          <span className="handled-dot" aria-hidden="true" />
          <span className="handled-count">HANDLED BRANDS</span>
        </div>
        <h2>
          Handled Brands & <span className="serif-italic">Clients</span>
        </h2>
      </header>

      <div className="client-logos-grid" role="list" aria-label="Client logos">
        {handledProjects.map((client, idx) => (
          <div
            key={client.id}
            className="client-logo-card"
            role="listitem"
            title={client.name}
            style={{
              animationDelay: `${idx * 0.45}s`,
            }}
          >
            <div
              className="client-logo-sheen"
              aria-hidden="true"
              style={{ animationDelay: `${(idx % 4) * 0.9}s` }}
            />
            <img
              src={client.image}
              alt={client.name}
              className="client-logo-img"
              loading="lazy"
            />
          </div>
        ))}
      </div>
    </section>
  )
}
