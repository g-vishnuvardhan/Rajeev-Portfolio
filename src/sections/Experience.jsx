import { useRef } from 'react'
import { experience } from '../data/content'
import { useGsap, gsap } from '../lib/useGsap'

export default function Experience() {
  const root = useRef()

  useGsap(() => {
    gsap.from('.experience .section-head', {
      y: 36, opacity: 0, duration: 1, ease: 'expo.out',
      scrollTrigger: { trigger: root.current, start: 'top 82%' },
    })
    gsap.fromTo('.tl-line-fill', { scaleY: 0 }, {
      scaleY: 1, ease: 'none', transformOrigin: 'top',
      scrollTrigger: { trigger: '.timeline', start: 'top 72%', end: 'bottom 70%', scrub: true },
    })
    gsap.utils.toArray('.tl-item').forEach((el, i) => {
      gsap.from(el, {
        opacity: 0, x: 38, duration: 0.95, delay: i * 0.04, ease: 'expo.out',
        scrollTrigger: { trigger: el, start: 'top 84%' },
      })
      const dot = el.querySelector('.tl-dot')
      if (dot) {
        gsap.from(dot, {
          scale: 0, duration: 0.55, ease: 'back.out(2.2)',
          scrollTrigger: { trigger: el, start: 'top 82%' },
        })
      }
    })
  }, root)

  return (
    <section id="experience" className="experience" ref={root}>
      <header className="section-head">
        <h2>Professional experience</h2>
      </header>
      <div className="timeline">
        <div className="tl-line" aria-hidden="true"><i className="tl-line-fill" /></div>
        <div className="tl-head tl-item">
          <h3>{experience.title}</h3>
          <p>{experience.company} <span>{experience.duration}</span></p>
        </div>
        <ol>
          {experience.responsibilities.map((r, i) => (
            <li className="tl-item glass-panel tl-card" key={i}>
              <span className="tl-dot" aria-hidden="true" />
              <span className="tl-step">{String(i + 1).padStart(2, '0')}</span>
              <p>{r}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
