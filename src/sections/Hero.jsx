import { useRef } from 'react'
import { site, heroMedia } from '../data/content'
import { useGsap, gsap } from '../lib/useGsap'
import { scrollToId } from '../lib/smooth'
import { useEnv } from '../lib/env'
import { Magnetic, RollText } from '../components/Magnetic'

export default function Hero({ ready = true }) {
  const root = useRef()
  const env = useEnv()

  useGsap(() => {
    if (!ready) {
      gsap.set(['.hero-line-inner', '.hero-fade'], { opacity: 0, y: 34 })
      gsap.set('.hero-media-img', { opacity: 0, scale: 1.06 })
      return
    }

    const tl = gsap.timeline({ defaults: { ease: 'expo.out' } })

    tl.to('.hero-media-img', { opacity: 1, scale: 1, duration: 1.6, ease: 'power3.out' }, 0)
      .to('.hero-line-inner', { y: 0, opacity: 1, duration: 1.2, stagger: 0.12 }, 0.06)
      .to('.hero-fade', { y: 0, opacity: 1, duration: 1.0, stagger: 0.08, ease: 'power3.out' }, 0.24)
      .fromTo('.hero-scroll-line', { scaleY: 0, transformOrigin: 'top' }, { scaleY: 1, duration: 0.9, ease: 'power2.inOut' }, 0.45)

    gsap.to('.hero-content', {
      y: -56,
      opacity: 0.1,
      ease: 'none',
      scrollTrigger: { trigger: root.current, start: 'top top', end: 'bottom top', scrub: true },
    })

    gsap.to('.hero-media-wrap', {
      yPercent: 6,
      ease: 'none',
      scrollTrigger: { trigger: root.current, start: 'top top', end: 'bottom top', scrub: true },
    })

    gsap.to('.hero-cross', {
      rotation: 180,
      ease: 'none',
      scrollTrigger: { trigger: root.current, start: 'top top', end: 'bottom top', scrub: true },
    })

    // Lusion-style subtle spatial mouse parallax
    if (!env.mobile) {
      const mx = gsap.quickTo('.hero-media-img', 'x', { duration: 1.1, ease: 'power3.out' })
      const my = gsap.quickTo('.hero-media-img', 'y', { duration: 1.1, ease: 'power3.out' })
      const tx = gsap.quickTo('.hero-content', 'x', { duration: 1.2, ease: 'power3.out' })
      const ty = gsap.quickTo('.hero-content', 'y', { duration: 1.2, ease: 'power3.out' })

      const onMove = (e) => {
        const nx = e.clientX / window.innerWidth - 0.5
        const ny = e.clientY / window.innerHeight - 0.5
        mx(-nx * 24)
        my(-ny * 16)
        tx(nx * 12)
        ty(ny * 8)
      }
      const el = root.current
      el.addEventListener('mousemove', onMove, { passive: true })
      return () => el.removeEventListener('mousemove', onMove)
    }
  }, root, [ready, env.mobile])

  return (
    <section id="home" className="hero" ref={root}>
      {/* Deep glass-black ambient atmosphere */}
      <div className="hero-atmosphere" aria-hidden="true" />

      {/* Right-side frameless blended portrait & camera rig */}
      <div className="hero-media-wrap" aria-hidden="true">
        {heroMedia.src && heroMedia.type === 'video' && (
          <video className="hero-media-img" src={heroMedia.src} autoPlay muted loop playsInline />
        )}
        {heroMedia.src && heroMedia.type === 'image' && (
          <img className="hero-media-img" src={heroMedia.src} alt="" decoding="async" fetchPriority="high" />
        )}
        <div className="hero-merge-scrim" />
      </div>

      {/* Subtle studio finishing vignette */}
      <div className="hero-vignette" aria-hidden="true" />

      {/* Precision crosshair markers */}
      <span className="hero-cross hero-cross--tr" aria-hidden="true">+</span>
      <span className="hero-cross hero-cross--br" aria-hidden="true">+</span>

      {/* Left-aligned classic editorial identity */}
      <div className="hero-inner">
        <div className="hero-content">
          <h1 className="hero-name" aria-label={site.name}>
            <span className="hero-line">
              <span className="hero-line-inner">RAJEEV</span>
            </span>
            <span className="hero-line">
              <span className="hero-line-inner hero-line-accent">KUMAR</span>
            </span>
          </h1>

          <p className="hero-role hero-fade">
            <span className="hero-dot" aria-hidden="true" />
            {site.role.toUpperCase()}
          </p>

          <p className="hero-tagline hero-fade">{site.tagline}</p>
          <p className="hero-loc hero-fade">{site.location}</p>

          <div className="hero-actions hero-fade">
            <Magnetic>
              <button type="button" className="glass-btn glass-btn--primary" onClick={() => scrollToId('work')}>
                <RollText text="Explore Gallery" />
                <svg className="btn-arrow" width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <path d="M2.5 8h11m0 0-4.5-4.5M13.5 8 9 12.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </Magnetic>
            <Magnetic>
              <button type="button" className="glass-btn glass-btn--ghost" onClick={() => scrollToId('contact')}>
                <RollText text="Start a Project" />
              </button>
            </Magnetic>
          </div>
        </div>
      </div>

      <button className="hero-scroll hero-fade" onClick={() => scrollToId('work')} aria-label="Scroll to the gallery">
        <span>Scroll to explore</span>
        <i className="hero-scroll-line" />
      </button>
    </section>
  )
}
