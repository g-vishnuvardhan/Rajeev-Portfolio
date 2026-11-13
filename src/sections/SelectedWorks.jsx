import { useRef } from 'react'
import { works } from '../data/works'
import { resolveSrc } from '../lib/placeholder'
import { useGsap, gsap, ScrollTrigger } from '../lib/useGsap'

export default function SelectedWorks() {
  const root = useRef()

  useGsap(() => {
    gsap.from('.works .section-head', {
      y: 36, opacity: 0, duration: 1, ease: 'expo.out',
      scrollTrigger: { trigger: root.current, start: 'top 82%' },
    })

    gsap.utils.toArray('.work').forEach((el) => {
      const hero = el.querySelector('.work-hero img')
      gsap.fromTo(hero, { yPercent: -7, scale: 1.12 }, {
        yPercent: 7, scale: 1.12, ease: 'none',
        scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true },
      })
      gsap.from(el.querySelector('.work-hero'), {
        clipPath: 'inset(10% 6% 10% 6% round 14px)',
        opacity: 0,
        duration: 1.25,
        ease: 'expo.out',
        scrollTrigger: { trigger: el, start: 'top 84%' },
      })
      gsap.from(el.querySelector('.work-title-inner'), {
        yPercent: 108, opacity: 0, duration: 1.05, ease: 'expo.out',
        scrollTrigger: { trigger: el.querySelector('.work-title'), start: 'top 90%' },
      })
      gsap.from(el.querySelectorAll('.work-strip li'), {
        y: 34, opacity: 0, duration: 0.9, stagger: 0.14, ease: 'power3.out',
        scrollTrigger: { trigger: el.querySelector('.work-strip'), start: 'top 86%' },
      })
    })

    // Subtle scroll-velocity skew like Lusion work reels
    const skewTo = gsap.quickTo('.work-hero', 'skewY', { duration: 0.45, ease: 'power3.out' })
    ScrollTrigger.create({
      trigger: root.current,
      start: 'top bottom',
      end: 'bottom top',
      onUpdate: (self) => {
        const v = Math.max(-2.2, Math.min(2.2, self.getVelocity() / 450))
        skewTo(v)
      },
    })
  }, root)

  return (
    <section id="selected" className="works" ref={root}>
      <header className="section-head">
        <h2>Selected Works</h2>
      </header>
      {works.map((w, i) => (
        <article className="work" key={i}>
          <div className="work-hero" style={{ aspectRatio: w.ratio > 1 ? '16 / 8' : '4 / 5' }}>
            <img src={resolveSrc(w.images[0], i, w.ratio, 'Project image placeholder')} alt="" loading="lazy" />
          </div>
          <div className="work-info">
            <div>
              <h3 className="work-title">
                <span className="mask">
                  <span className="work-title-inner">{w.title}</span>
                </span>
              </h3>
              <p className="work-meta">{w.category}{w.year ? ` · ${w.year}` : ''}</p>
            </div>
            <p className="work-desc">{w.description}</p>
          </div>
          <ul className="work-strip">
            {w.images.slice(1).map((src, k) => (
              <li key={k}>
                <img src={resolveSrc(src, i + k + 1, 1.5, 'Project image placeholder')} alt="" loading="lazy" />
              </li>
            ))}
          </ul>
        </article>
      ))}
    </section>
  )
}
