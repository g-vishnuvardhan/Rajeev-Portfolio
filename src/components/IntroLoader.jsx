import { useEffect, useRef, useState } from 'react'
import { gsap } from '../lib/useGsap'
import { heroMedia, site } from '../data/content'
import RKLogo from './RKLogo'

export default function IntroLoader({ reduced, onComplete }) {
  const root = useRef(null)
  const logoWrapRef = useRef(null)
  const [gone, setGone] = useState(reduced)

  useEffect(() => {
    if (reduced) {
      onComplete()
      return
    }

    let cancelled = false
    const el = root.current

    // Preload hero image & wait for fonts so hero renders instantly with zero stutter
    const preloadHero = new Promise((resolve) => {
      if (!heroMedia?.src || heroMedia.type !== 'image') return resolve()
      const img = new Image()
      img.src = heroMedia.src
      if (img.decode) img.decode().then(resolve).catch(resolve)
      else {
        img.onload = resolve
        img.onerror = resolve
      }
    })

    const fontsReady = document.fonts ? document.fonts.ready : Promise.resolve()

    const ctx = gsap.context(() => {
      const ring = el.querySelector('.rk-ring')
      const aura = el.querySelector('.rk-aura-glow')
      const crosses = el.querySelectorAll('.intro-cross')

      if (ring) {
        const rLen = ring.getTotalLength()
        gsap.set(ring, { strokeDasharray: rLen, strokeDashoffset: rLen })
      }

      gsap.to(crosses, { rotation: 180, duration: 2.2, ease: 'power2.inOut', stagger: 0.08 })

      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } })

      // 1. Subtle registration crosshairs & infinite aura glow blossom
      tl.fromTo(crosses, { scale: 0, opacity: 0 }, { scale: 1, opacity: 0.45, duration: 0.6, stagger: 0.06, ease: 'back.out(1.7)' }, 0)
        .fromTo(['.intro-glow', aura], { scale: 0.5, opacity: 0 }, { scale: 1, opacity: 1, duration: 1.1, ease: 'power2.out' }, 0.05)
        .to(ring, { strokeDashoffset: 0, duration: 1.05, ease: 'power2.inOut' }, 0.1)
        // 2. Letters R and K converge smoothly into the monogram lockup
        .fromTo('.intro-logo .rk-r', { x: -18, opacity: 0, scale: 1.08 }, { x: 0, opacity: 1, scale: 1, duration: 0.85, ease: 'expo.out' }, 0.22)
        .fromTo('.intro-logo .rk-k', { x: 18, opacity: 0, scale: 1.08 }, { x: 0, opacity: 1, scale: 1, duration: 0.85, ease: 'expo.out' }, 0.22)
        // 3. Name on top, Director of Photography kept down on its own separate line
        .fromTo('.intro-name', { y: 10, opacity: 0 }, { y: 0, opacity: 1, duration: 0.75 }, 0.38)
        .fromTo('.intro-role', { y: 8, opacity: 0 }, { y: 0, opacity: 1, duration: 0.75 }, 0.5)

      // Hold briefly so user enjoys the emblem, then execute cinematic FLIP flight from center to nav logo
      Promise.all([
        preloadHero,
        fontsReady,
        new Promise((resolve) => tl.eventCallback('onComplete', resolve)),
        new Promise((resolve) => setTimeout(resolve, 550)),
      ]).then(() => {
        if (cancelled) return

        const navLogoEl = document.querySelector('.nav-logo')
        const navRect = navLogoEl
          ? navLogoEl.getBoundingClientRect()
          : { left: 40, top: 20, width: 44, height: 44 }

        const centerLogo = logoWrapRef.current
        if (!centerLogo) return
        const centerRect = centerLogo.getBoundingClientRect()

        const scale = navRect.width / centerRect.width
        const targetX = (navRect.left + navRect.width / 2) - (centerRect.left + centerRect.width / 2)
        const targetY = (navRect.top + navRect.height / 2) - (centerRect.top + centerRect.height / 2)

        let heroFired = false
        const fireHero = () => {
          if (!heroFired) {
            heroFired = true
            onComplete()
          }
        }

        const exitTl = gsap.timeline({
          onComplete: () => {
            if (cancelled) return
            setGone(true)
            fireHero()
          },
        })

        exitTl
          // A. Fade text and corner markers smoothly
          .to(['.intro-meta', crosses, '.intro-glow'], {
            opacity: 0,
            y: -10,
            duration: 0.45,
            ease: 'power2.in',
          }, 0)
          // B. Dissolve preloader backdrop gracefully to reveal the home page underneath
          .to('.intro-backdrop', {
            opacity: 0,
            duration: 1.05,
            ease: 'power2.inOut',
          }, 0.1)
          // C. Trigger hero section bloom while logo is in mid-flight
          .call(fireHero, [], 0.32)
          // D. Center logo smoothly glides, scales, and docks directly into the nav logo position
          .to(centerLogo, {
            x: targetX,
            y: targetY,
            scale: scale,
            duration: 1.15,
            ease: 'power3.inOut',
          }, 0.1)
      })
    }, root)

    return () => {
      cancelled = true
      ctx.revert()
    }
  }, [reduced, onComplete])

  if (gone) return null

  return (
    <div className="intro-overlay" ref={root} aria-hidden="true">
      <div className="intro-backdrop" />
      <div className="intro-glow" />

      {/* Precision corner crosshairs */}
      <span className="intro-cross intro-cross--tl">+</span>
      <span className="intro-cross intro-cross--tr">+</span>
      <span className="intro-cross intro-cross--bl">+</span>
      <span className="intro-cross intro-cross--br">+</span>

      <div className="intro-stage">
        <div className="intro-logo-wrap" ref={logoWrapRef}>
          <RKLogo size="xl" className="intro-logo" />
        </div>
        <div className="intro-meta">
          <p className="intro-name">{site.name.toUpperCase()}</p>
          <p className="intro-role">{site.role.toUpperCase()}</p>
        </div>
      </div>
    </div>
  )
}
