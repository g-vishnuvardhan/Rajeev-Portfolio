import { useRef } from 'react'
import { handledProjects } from '../data/handledProjects'
import { useGsap, gsap } from '../lib/useGsap'

export default function HandledProjects() {
  const root = useRef(null)

  useGsap(() => {
    gsap.from('.handled-projects .section-head', {
      y: 35,
      opacity: 0,
      duration: 1.0,
      ease: 'expo.out',
      scrollTrigger: { trigger: root.current, start: 'top 82%' },
    })

    gsap.from('.client-logo-card', {
      y: 30,
      opacity: 0,
      scale: 0.94,
      duration: 0.7,
      stagger: 0.04,
      ease: 'power3.out',
      scrollTrigger: { trigger: '.client-logos-grid', start: 'top 85%' },
    })
  }, root)

  return (
    <section id="projects" className="handled-projects" ref={root}>
      <div className="handled-ambient" aria-hidden="true" />

      <header className="section-head handled-head">
        <div className="handled-eyebrow">
          <span className="handled-badge">PORTFOLIO</span>
          <span className="handled-dot" aria-hidden="true" />
          <span className="handled-count">HANDLED BRANDS</span>
        </div>
        <h2>
          Handled Brands & <span className="serif-italic">Clients</span>
        </h2>
      </header>

      <div className="client-logos-grid" role="list" aria-label="Client logos">
        {handledProjects.map((client) => (
          <div key={client.id} className="client-logo-card" role="listitem" title={client.name}>
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
