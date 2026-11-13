import { useEffect, useRef, useState } from 'react'
import { gsap } from '../lib/useGsap'
import { heroMedia, site } from '../data/content'
import { signatureVectorPath, signatureMaskStrokes, signatureViewBox } from '../data/signatureData'

export default function IntroLoader({ reduced, onComplete }) {
  const root = useRef(null)
  const stageRef = useRef(null)
  const [gone, setGone] = useState(reduced)

  useEffect(() => {
    if (reduced) {
      onComplete()
      return
    }

    let cancelled = false
    const el = root.current
    if (!el) return

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
      const strokes = el.querySelectorAll('.intro-mask-stroke')
      const crosses = el.querySelectorAll('.intro-cross')
      const stage = stageRef.current
      const signBase = el.querySelector('.intro-sign-base')

      // Measure and hide each handwriting mask stroke initially
      strokes.forEach((stroke) => {
        const len = stroke.getTotalLength()
        gsap.set(stroke, { strokeDasharray: len + 4, strokeDashoffset: len + 4 })
      })

      // Precision corner crosshairs subtle rotation
      gsap.to(crosses, { rotation: 180, duration: 2.2, ease: 'power2.inOut', stagger: 0.08 })

      const tl = gsap.timeline({ defaults: { ease: 'power2.out' } })

      // 1. Crosshairs & warm ambient aura bloom
      tl.fromTo(crosses, { scale: 0, opacity: 0 }, { scale: 1, opacity: 0.35, duration: 0.6, stagger: 0.06, ease: 'back.out(1.7)' }, 0)
        .fromTo(['.intro-glow', '.intro-aura'], { scale: 0.6, opacity: 0 }, { scale: 1, opacity: 1, duration: 1.2, ease: 'power2.out' }, 0.05)

      // 2. Writing animation — authentic calligraphic handwriting stroke sequence
      // Stroke 1: R cursive arch and bottom loop
      if (strokes[0]) {
        tl.to(strokes[0], { strokeDashoffset: 0, duration: 0.95, ease: 'power1.inOut' }, 0.15)
      }
      // Stroke 2: R dynamic downward slash
      if (strokes[1]) {
        tl.to(strokes[1], { strokeDashoffset: 0, duration: 0.38, ease: 'power2.out' }, 0.72)
      }
      // Stroke 3: K vertical stem slash
      if (strokes[2]) {
        tl.to(strokes[2], { strokeDashoffset: 0, duration: 0.42, ease: 'power2.out' }, 1.02)
      }
      // Stroke 4: K upper diagonal branch
      if (strokes[3]) {
        tl.to(strokes[3], { strokeDashoffset: 0, duration: 0.28, ease: 'power2.out' }, 1.34)
      }
      // Stroke 5: K lower loop & majestic flourish underline
      if (strokes[4]) {
        tl.to(strokes[4], { strokeDashoffset: 0, duration: 0.82, ease: 'power2.out' }, 1.50)
      }

      // Ensure 100% full vector fidelity once writing strokes complete
      tl.call(() => {
        if (signBase) signBase.removeAttribute('mask')
      }, [], 2.22)

      // 3. Typography: RAJEEV KUMAR on top, DIRECTOR OF PHOTOGRAPHY below
      tl.fromTo(
        '.intro-name',
        { y: 14, opacity: 0, letterSpacing: '0.22em' },
        { y: 0, opacity: 1, letterSpacing: '0.38em', duration: 0.75, ease: 'power3.out' },
        2.12
      )
      tl.fromTo(
        '.intro-role',
        { y: 10, opacity: 0, letterSpacing: '0.18em' },
        { y: 0, opacity: 0.85, letterSpacing: '0.28em', duration: 0.75, ease: 'power3.out' },
        2.34
      )

      // Hold briefly so user enjoys the complete cinematic title card
      Promise.all([
        preloadHero,
        fontsReady,
        new Promise((resolve) => tl.eventCallback('onComplete', resolve)),
        new Promise((resolve) => setTimeout(resolve, 650)),
      ]).then(() => {
        if (cancelled) return

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

        // 4. Cinematic Exit: "sign should coming out of the screen"
        // The signature and title rush forward in 3D right past the viewer's eyes
        exitTl
          .to(crosses, { opacity: 0, duration: 0.3, ease: 'power2.in' }, 0)
          .to(
            stage,
            {
              scale: 5.4,
              z: 600,
              opacity: 0,
              filter: 'blur(22px)',
              duration: 1.15,
              ease: 'power3.in',
              transformOrigin: '50% 45%',
            },
            0
          )
          .to(
            ['.intro-backdrop', '.intro-glow'],
            {
              opacity: 0,
              duration: 1.05,
              ease: 'power2.inOut',
            },
            0.15
          )
          .call(fireHero, [], 0.42)
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

      <div className="intro-stage" ref={stageRef}>
        <div className="intro-sign-wrap">
          <svg className="intro-sign-svg" viewBox={signatureViewBox} fill="none">
            <defs>
              <mask id="introSignMask" maskUnits="userSpaceOnUse" x="-50" y="-50" width="615" height="345">
                <rect x="-50" y="-50" width="615" height="345" fill="black" />
                {signatureMaskStrokes.map((d, i) => (
                  <path
                    key={i}
                    className={`intro-mask-stroke intro-mask-stroke--${i + 1}`}
                    d={d}
                    fill="none"
                    stroke="white"
                    strokeWidth="32"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                ))}
              </mask>
              <radialGradient id="introAuraGrad" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#f4eee4" stopOpacity="0.22" />
                <stop offset="50%" stopColor="#f4eee4" stopOpacity="0.08" />
                <stop offset="100%" stopColor="#f4eee4" stopOpacity="0" />
              </radialGradient>
            </defs>

            <ellipse cx="257" cy="122" rx="230" ry="110" fill="url(#introAuraGrad)" className="intro-aura" />

            <path
              className="intro-sign-base"
              d={signatureVectorPath}
              fill="#f4eee4"
              mask="url(#introSignMask)"
            />
          </svg>
        </div>

        <div className="intro-meta">
          <p className="intro-name">{site.name.toUpperCase()}</p>
          <p className="intro-role">{site.role.toUpperCase()}</p>
        </div>
      </div>
    </div>
  )
}
