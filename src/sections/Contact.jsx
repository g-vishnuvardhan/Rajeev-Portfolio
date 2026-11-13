import { useEffect, useRef, useState } from 'react'
import { site as staticSite } from '../data/content'
import { useGsap, gsap } from '../lib/useGsap'
import { Magnetic, RollText } from '../components/Magnetic'
import { useData } from '../context/DataContext'

function FlankVideo({ src, poster, className }) {
  const ref = useRef(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    el.muted = true
    const p = el.play()
    if (p !== undefined) {
      p.catch(() => {
        const resume = () => {
          el.play().catch(() => {})
          window.removeEventListener('pointerdown', resume)
          window.removeEventListener('scroll', resume)
        }
        window.addEventListener('pointerdown', resume, { once: true, passive: true })
        window.addEventListener('scroll', resume, { once: true, passive: true })
      })
    }
  }, [])

  return (
    <video
      ref={ref}
      className={className}
      src={src}
      poster={poster}
      autoPlay
      muted
      loop
      playsInline
      preload="metadata"
    />
  )
}

export default function Contact() {
  const root = useRef()
  const [sent, setSent] = useState(false)
  const { site = staticSite } = useData()

  useGsap(() => {
    gsap.from('.contact-head-line', {
      yPercent: 105, opacity: 0, duration: 1.15, ease: 'expo.out', stagger: 0.12,
      scrollTrigger: { trigger: '.contact-head', start: 'top 82%' },
    })
    gsap.from('.enquiry-wrap .enquiry', {
      y: 42, opacity: 0, duration: 1.0, ease: 'expo.out',
      scrollTrigger: { trigger: '.enquiry-wrap', start: 'top 84%' },
    })
    gsap.from('.enquiry-flank--left', {
      x: -40, opacity: 0, duration: 1.2, ease: 'expo.out',
      scrollTrigger: { trigger: '.enquiry-wrap', start: 'top 84%' },
    })
    gsap.from('.enquiry-flank--right', {
      x: 40, opacity: 0, duration: 1.2, ease: 'expo.out',
      scrollTrigger: { trigger: '.enquiry-wrap', start: 'top 84%' },
    })
    // seamless closing reveal: image smoothly merges into the page atmosphere
    const tl = gsap.timeline({
      scrollTrigger: { trigger: '.closing', start: 'top 85%', end: 'bottom bottom', scrub: true },
    })
    tl.fromTo('.closing-img', { scale: 1.08, opacity: 0.65 }, { scale: 1.0, opacity: 1, ease: 'none' }, 0)
      .fromTo('.closing-card', { opacity: 0, y: 32 }, { opacity: 1, y: 0, ease: 'none' }, 0.2)

    gsap.from('.closing-contact-item', {
      y: 26, opacity: 0, duration: 0.8, stagger: 0.08, ease: 'power3.out',
      scrollTrigger: { trigger: '.closing-contact', start: 'top 88%' },
    })
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

      <div className="enquiry-wrap">
        <div className="enquiry-stage">
          <div className="enquiry-flank enquiry-flank--left" aria-hidden="true">
            <div className="enquiry-video-aura enquiry-video-aura--gold" />
            <div className="enquiry-video-media">
              <FlankVideo
                src="/videos/jewlary.mp4"
                poster="/videos/jewellery-poster.jpg"
                className="enquiry-video"
              />
              <div className="enquiry-video-vignette enquiry-video-vignette--left" />
            </div>
          </div>

          <form className="enquiry glass-panel" onSubmit={submit}>
            <h3>Project enquiry</h3>
            <div className="enquiry-row">
              <label>Name<input name="name" required autoComplete="name" placeholder="Your name" /></label>
              <label>Email<input name="email" type="email" required autoComplete="email" placeholder="you@example.com" /></label>
            </div>
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

          <div className="enquiry-flank enquiry-flank--right" aria-hidden="true">
            <div className="enquiry-video-aura enquiry-video-aura--dop" />
            <div className="enquiry-video-media">
              <FlankVideo
                src="/videos/rajeev_dop_post_20261113.mp4"
                poster="/videos/rk_dop-poster.jpg"
                className="enquiry-video"
              />
              <div className="enquiry-video-vignette enquiry-video-vignette--right" />
            </div>
          </div>
        </div>
      </div>

      <div className="closing">
        <div className="closing-media">
          <img
            src="/photos/closing-portrait.png"
            alt={`${site.name} — silhouette`}
            className="closing-img"
          />
          <div className="closing-scrim" aria-hidden="true" />
        </div>
        <div className="closing-card">
          <p className="closing-name">{site.name}</p>
          <p className="closing-role muted">{site.role} · {site.location}</p>
        </div>
      </div>

      <footer className="closing-contact">
        <div className="closing-contact-grid">
          <div className="closing-contact-item closing-contact-item--phone">
            <span className="closing-contact-label">Direct Phone</span>
            <a href={site.phoneHref} className="closing-contact-link">
              <RollText text={site.phone} />
            </a>
          </div>
          <div className="closing-contact-item closing-contact-item--email">
            <span className="closing-contact-label">Direct Email</span>
            <a href={`mailto:${site.email}`} className="closing-contact-link">
              <RollText text={site.email} />
            </a>
          </div>
          <div className="closing-contact-item closing-contact-item--whatsapp">
            <span className="closing-contact-label">WhatsApp</span>
            <a href={site.whatsapp} target="_blank" rel="noopener noreferrer" className="closing-contact-link">
              <RollText text="WhatsApp Direct" />
            </a>
          </div>
          <div className="closing-contact-item closing-contact-item--instagram">
            <span className="closing-contact-label">Instagram</span>
            <a
              href={site.instagram || 'https://instagram.com/rajeev_dop'}
              target="_blank"
              rel="noopener noreferrer"
              className="closing-contact-link"
              aria-label="Instagram @rajeev_dop"
            >
              <RollText text={site.instagramHandle || '@rajeev_dop'} />
            </a>
          </div>
          <div className="closing-contact-item closing-contact-item--location">
            <span className="closing-contact-label">Base Location</span>
            <p className="closing-contact-val">{site.fullLocation}</p>
          </div>
        </div>
        <div className="closing-copyright">
          <p>© {new Date().getFullYear()} {site.name}. All rights reserved.</p>
          <p className="closing-tagline">{site.tagline}</p>
        </div>
      </footer>
    </section>
  )
}
