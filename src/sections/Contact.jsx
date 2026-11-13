import { useRef, useState } from 'react'
import { site } from '../data/content'
import { useGsap, gsap } from '../lib/useGsap'
import { Magnetic, RollText } from '../components/Magnetic'

export default function Contact() {
  const root = useRef()
  const [sent, setSent] = useState(false)

  useGsap(() => {
    gsap.from('.contact-head-line', {
      yPercent: 105, opacity: 0, duration: 1.15, ease: 'expo.out', stagger: 0.12,
      scrollTrigger: { trigger: '.contact-head', start: 'top 82%' },
    })
    gsap.from('.contact-grid .glass-panel', {
      y: 42, opacity: 0, duration: 1.0, stagger: 0.14, ease: 'expo.out',
      scrollTrigger: { trigger: '.contact-grid', start: 'top 84%' },
    })
    // cinematic closing: letterbox bars close in, then fade to black
    const tl = gsap.timeline({
      scrollTrigger: { trigger: '.closing', start: 'top 85%', end: 'bottom bottom', scrub: true },
    })
    tl.fromTo('.bar-top', { yPercent: -100 }, { yPercent: 0, ease: 'none' }, 0)
      .fromTo('.bar-bottom', { yPercent: 100 }, { yPercent: 0, ease: 'none' }, 0)
      .fromTo('.closing-card', { opacity: 0, scale: 0.96 }, { opacity: 1, scale: 1, ease: 'none' }, 0.55)
  }, root)

  const submit = (e) => {
    e.preventDefault()
    const f = new FormData(e.target)
    const subject = encodeURIComponent(`Enquiry — ${f.get('type')}`)
    const body = encodeURIComponent(`${f.get('message')}\n\n— ${f.get('name')}\n${f.get('email')}`)
    window.location.href = `mailto:${site.email}?subject=${subject}&body=${body}`
    setSent(true)
  }

  return (
    <section id="contact" className="contact" ref={root}>
      <h2 className="contact-head" aria-label="Have a story to tell? Let's create something cinematic.">
        <span className="mask"><span className="contact-head-line">Have a story to tell?</span></span>
        <span className="mask sub"><span className="contact-head-line">Let’s create something cinematic.</span></span>
      </h2>

      <div className="contact-grid">
        <div className="contact-info glass-panel">
          <p className="contact-name">{site.name}</p>
          <p>{site.role}</p>
          <p>{site.fullLocation}</p>
          <ul className="contact-links">
            <li><a href={site.phoneHref}><RollText text={site.phone} /></a></li>
            <li><a href={`mailto:${site.email}`}><RollText text={site.email} /></a></li>
            <li><a href={site.whatsapp} target="_blank" rel="noopener noreferrer"><RollText text="WhatsApp" /></a></li>
            <li>
              {site.instagram
                ? <a href={site.instagram} target="_blank" rel="noopener noreferrer"><RollText text="Instagram" /></a>
                : <span className="muted">Instagram — link to be added</span>}
            </li>
          </ul>
        </div>

        <form className="enquiry glass-panel" onSubmit={submit}>
          <h3>Project enquiry</h3>
          <label>Name<input name="name" required autoComplete="name" placeholder="Your name" /></label>
          <label>Email<input name="email" type="email" required autoComplete="email" placeholder="you@example.com" /></label>
          <label>Project type
            <select name="type" defaultValue="Cinematography">
              <option>Cinematography</option>
              <option>Fashion or model shoot</option>
              <option>Jewellery or product</option>
              <option>Brand campaign</option>
              <option>Interior or outdoor</option>
              <option>Reels and social content</option>
              <option>Something else</option>
            </select>
          </label>
          <label>Message<textarea name="message" rows="4" required placeholder="Tell us about your shoot, dates, and vision..." /></label>
          <Magnetic>
            <button type="submit" className="glass-btn glass-btn--primary">
              <RollText text="Send enquiry" />
              <svg className="btn-arrow" width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path d="M2.5 8h11m0 0-4.5-4.5M13.5 8 9 12.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </Magnetic>
          <p className="form-note" role="status">
            {sent ? 'Your email app should open with the enquiry ready to send.' : 'This opens your email app with the message ready to send.'}
          </p>
        </form>
      </div>

      <div className="closing">
        <div className="bar bar-top" />
        <div className="bar bar-bottom" />
        <div className="closing-card">
          <p>{site.name}</p>
          <p className="muted">{site.role} · {site.location}</p>
        </div>
      </div>
    </section>
  )
}
