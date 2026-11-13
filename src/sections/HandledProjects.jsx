import { useRef, useState } from 'react'
import { handledProjects } from '../data/handledProjects'
import { useGsap, gsap, ScrollTrigger } from '../lib/useGsap'
import { Magnetic, RollText } from '../components/Magnetic'

export default function HandledProjects() {
  const root = useRef(null)
  const trackRef = useRef(null)
  const [activeFilter, setActiveFilter] = useState('all')
  const [selectedProject, setSelectedProject] = useState(null)

  const filterCategories = [
    { id: 'all', label: 'All Projects (8)' },
    { id: 'fashion', label: 'Fashion & Silks (4)' },
    { id: 'jewellery', label: 'Jewellery Films (2)' },
    { id: 'lifestyle', label: 'Culinary & Lifestyle (2)' },
  ]

  const filteredProjects = handledProjects.filter((p) => {
    if (activeFilter === 'all') return true
    if (activeFilter === 'fashion') return p.id.includes('mall') || p.id.includes('silks') || p.id.includes('kalamandir')
    if (activeFilter === 'jewellery') return p.id.includes('jewellery')
    if (activeFilter === 'lifestyle') return p.id.includes('biryani') || p.id.includes('cocotime')
    return true
  })

  useGsap(() => {
    // Header entrance
    gsap.from('.handled-projects .section-head', {
      y: 40,
      opacity: 0,
      duration: 1.1,
      ease: 'expo.out',
      scrollTrigger: { trigger: root.current, start: 'top 82%' },
    })

    // Filter tabs entrance
    gsap.from('.handled-projects .fashion-filters', {
      y: 24,
      opacity: 0,
      duration: 0.8,
      ease: 'power3.out',
      scrollTrigger: { trigger: '.handled-projects .fashion-filters', start: 'top 88%' },
    })

    // Fashion cards staggered runway reveal
    gsap.from('.handled-card', {
      y: 48,
      opacity: 0,
      scale: 0.96,
      duration: 0.9,
      stagger: 0.08,
      ease: 'power3.out',
      scrollTrigger: { trigger: '.handled-grid', start: 'top 84%' },
    })

    // Runway Marquee continuous glide with scroll speed boost
    const track = trackRef.current
    if (track) {
      const tween = gsap.to(track, {
        xPercent: -50,
        repeat: -1,
        duration: 32,
        ease: 'none',
      })

      ScrollTrigger.create({
        trigger: root.current,
        start: 'top bottom',
        end: 'bottom top',
        onUpdate: (self) => {
          const boost = 1 + Math.min(Math.abs(self.getVelocity()) / 400, 3.2)
          gsap.to(tween, { timeScale: boost, duration: 0.2, overwrite: 'auto' })
          gsap.to(tween, { timeScale: 1, duration: 0.8, delay: 0.15, overwrite: false })
        },
      })
    }
  }, root, [activeFilter])

  return (
    <section id="projects" className="handled-projects" ref={root}>
      {/* Ambient Runway Atmosphere */}
      <div className="handled-ambient" aria-hidden="true" />

      <header className="section-head handled-head">
        <div className="handled-eyebrow">
          <span className="handled-badge">COMMERCIAL PORTFOLIO</span>
          <span className="handled-dot" aria-hidden="true" />
          <span className="handled-count">8 HANDLED CLIENT PROJECTS</span>
        </div>
        <h2>
          Handled Projects & <span className="serif-italic">Fashion Campaigns</span>
        </h2>
        <p>
          Cinematography, television commercials, and visual storytelling crafted for premier
          fashion houses, haute couture silk weavers, luxury jewellers, and consumer brands.
        </p>
      </header>

      {/* Infinite Kinetic Runway Ribbon */}
      <div className="fashion-runway" aria-label="Commercial clients ticker">
        <div className="fashion-track" ref={trackRef}>
          {[...handledProjects, ...handledProjects].map((project, idx) => (
            <div
              key={`${project.id}-${idx}`}
              className="runway-pill"
              onClick={() => setSelectedProject(project)}
              role="button"
              tabIndex={0}
            >
              <span className="runway-idx">{String((idx % handledProjects.length) + 1).padStart(2, '0')}</span>
              <span className="runway-logo-box">
                <img src={project.image} alt={project.name} loading="lazy" />
              </span>
              <span className="runway-name">{project.name}</span>
              <span className="runway-tag">{project.tag}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Editorial Filter Navigation */}
      <div className="fashion-filters" role="group" aria-label="Filter handled projects">
        {filterCategories.map((f) => (
          <button
            key={f.id}
            type="button"
            className={`fashion-filter-btn ${activeFilter === f.id ? 'is-active' : ''}`}
            onClick={() => setActiveFilter(f.id)}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* High-Fashion Editorial Project Grid */}
      <div className="handled-grid">
        {filteredProjects.map((project, idx) => (
          <article
            key={project.id}
            className="handled-card"
            onClick={() => setSelectedProject(project)}
            tabIndex={0}
            role="button"
            aria-label={`View details for ${project.name}`}
          >
            {/* Editorial Header */}
            <div className="card-top-bar">
              <span className="card-catalog">PROJECT {String(idx + 1).padStart(2, '0')} / 08</span>
              <span className="card-year">{project.year}</span>
            </div>

            {/* High-Fashion Showcase Window */}
            <div className="card-emblem-wrap">
              <div className="card-emblem-stage">
                <img
                  src={project.image}
                  alt={`${project.name} campaign logo`}
                  className="card-emblem-img"
                  loading="lazy"
                />
              </div>
              <div className="card-emblem-sheen" aria-hidden="true" />
              <span className="card-tag-floating">{project.tag}</span>
            </div>

            {/* Campaign Meta */}
            <div className="card-body">
              <p className="card-category">{project.category.toUpperCase()}</p>
              <h3 className="card-title">{project.name}</h3>
              <p className="card-desc">{project.description}</p>

              {/* Technical Highlights Pills */}
              <div className="card-pills">
                {project.highlights.map((h, i) => (
                  <span key={i} className="card-pill">
                    {h}
                  </span>
                ))}
              </div>

              {/* Card Footer */}
              <div className="card-footer">
                <span className="card-scope">{project.scope}</span>
                <span className="card-action">
                  <span>Explore Campaign</span>
                  <svg width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                    <path
                      d="M2.5 8h11m0 0-4.5-4.5M13.5 8 9 12.5"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
              </div>
            </div>
          </article>
        ))}
      </div>

      {/* High-Fashion Quick-View Modal */}
      {selectedProject && (
        <div
          className="fashion-modal-backdrop"
          onClick={() => setSelectedProject(null)}
          role="dialog"
          aria-modal="true"
          aria-label={selectedProject.name}
        >
          <div className="fashion-modal-card" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="fashion-modal-close"
              onClick={() => setSelectedProject(null)}
              aria-label="Close modal"
            >
              ✕
            </button>

            <div className="fashion-modal-image-wrap">
              <img src={selectedProject.image} alt={selectedProject.name} />
            </div>

            <div className="fashion-modal-info">
              <span className="fashion-modal-badge">{selectedProject.tag.toUpperCase()}</span>
              <h3 className="fashion-modal-title">{selectedProject.name}</h3>
              <p className="fashion-modal-cat">{selectedProject.category}</p>
              <p className="fashion-modal-desc">{selectedProject.description}</p>

              <div className="fashion-modal-section">
                <h4>Cinematography & Production Scope</h4>
                <p className="fashion-modal-meta">{selectedProject.scope}</p>
              </div>

              <div className="fashion-modal-section">
                <h4>Campaign Execution Highlights</h4>
                <ul className="fashion-modal-list">
                  {selectedProject.highlights.map((item, idx) => (
                    <li key={idx}>✓ {item}</li>
                  ))}
                </ul>
              </div>

              <div className="fashion-modal-action">
                <Magnetic>
                  <button
                    type="button"
                    className="glass-btn glass-btn--primary"
                    onClick={() => setSelectedProject(null)}
                  >
                    <RollText text="Close Showcase" />
                  </button>
                </Magnetic>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
