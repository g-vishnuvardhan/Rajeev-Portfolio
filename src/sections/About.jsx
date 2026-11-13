import { useRef } from 'react'
import { about as staticAbout, brands, site as staticSite } from '../data/content'
import { resolveSrc } from '../lib/placeholder'
import Words from '../components/Words'
import { useGsap, gsap } from '../lib/useGsap'
import { useData } from '../context/DataContext'

const STATS = [
  { num: 4, suffix: '+', label: 'Years on set' },
  { num: 50, suffix: '+', label: 'Productions shot' },
  { num: brands.length, suffix: '+', label: 'Commercial brands' },
]

export default function About() {
  const root = useRef()
  const { about = staticAbout, site = staticSite } = useData()

  useGsap(() => {
    gsap.from('.about-photo', {
      clipPath: 'inset(14% 0% 14% 0% round 14px)',
      opacity: 0,
      duration: 1.35,
      ease: 'expo.out',
      scrollTrigger: { trigger: '.about-photo', start: 'top 82%' },
    })

    gsap.fromTo('.about-photo img', { yPercent: -8, scale: 1.16 }, {
      yPercent: 8, scale: 1.16, ease: 'none',
      scrollTrigger: { trigger: '.about-photo', start: 'top bottom', end: 'bottom top', scrub: true },
    })

    gsap.from('.about-copy h2, .about-line', {
      y: 36, opacity: 0, duration: 1.0, stagger: 0.1, ease: 'expo.out',
      scrollTrigger: { trigger: '.about-copy', start: 'top 82%' },
    })

    gsap.utils.toArray('.words').forEach((p) => {
      gsap.fromTo(p.querySelectorAll('.w'), { opacity: 0.16 }, {
        opacity: 1, stagger: 0.05, ease: 'none',
        scrollTrigger: { trigger: p, start: 'top 84%', end: 'bottom 58%', scrub: true },
      })
    })

    // Lusion-inspired rotating crosshairs tied to scroll
    gsap.to('.about-cross', {
      rotation: 360,
      ease: 'none',
      scrollTrigger: { trigger: root.current, start: 'top bottom', end: 'bottom top', scrub: true },
    })

    // Tabular count-up telemetry cards
    gsap.utils.toArray('.about-stat').forEach((card, idx) => {
      const numEl = card.querySelector('.about-stat-val')
      const target = Number(numEl.dataset.target || 0)
      const obj = { val: 0 }
      gsap.from(card, {
        y: 28, opacity: 0, duration: 0.9, delay: idx * 0.1, ease: 'power3.out',
        scrollTrigger: { trigger: '.about-stats', start: 'top 86%' },
      })
      gsap.to(obj, {
        val: target,
        duration: 1.4,
        delay: idx * 0.1,
        ease: 'power2.out',
        scrollTrigger: { trigger: '.about-stats', start: 'top 86%', once: true },
        onUpdate: () => {
          numEl.textContent = String(Math.round(obj.val)).padStart(2, '0')
        },
      })
    })
  }, root)

  return (
    <section id="about" className="about" ref={root}>
      <div className="about-crosses" aria-hidden="true">
        <span className="about-cross">+</span>
        <span className="about-cross">+</span>
        <span className="about-cross">+</span>
      </div>

      <div className="about-photo">
        <img src={resolveSrc(about.photo, 2, 0.8, 'Portrait placeholder')} alt={about.photo ? `${site.name}` : ''} loading="lazy" />
      </div>

      <div className="about-copy">
        <h2>{site.name}</h2>
        <p className="about-line">{about.titleLine}</p>
        <blockquote>
          <Words text={`“${about.quote}”`} className="about-quote" />
        </blockquote>
        <div className="about-profile">
          {about.profile.map((t, i) => (
            <Words key={i} text={t} />
          ))}
        </div>

        <ul className="about-stats">
          {STATS.map((s) => (
            <li className="about-stat glass-panel" key={s.label}>
              <p className="about-stat-num">
                <span className="about-stat-bracket">[[</span>
                <span className="about-stat-val" data-target={s.num}>00</span>
                <span>{s.suffix}</span>
                <span className="about-stat-bracket">]]</span>
              </p>
              <p className="about-stat-label">{s.label}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
