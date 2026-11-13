import { useEffect, useRef, useState } from 'react'
import { gsap } from '../lib/useGsap'
import { heroMedia, site } from '../data/content'
import { signatureStrokes, signatureViewBox } from '../data/signatureData'

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
      const strokes = el.querySelectorAll('.intro-hello-stroke')
      const crosses = el.querySelectorAll('.intro-cross')
      const stage = stageRef.current

      // Measure exact path lengths and hide each stroke initially (Apple "hello" technique)
      strokes.forEach((stroke) => {
        const len = stroke.getTotalLength()
        gsap.set(stroke, { strokeDasharray: len + 1, strokeDashoffset: len + 1 })
      })

      // Crosshairs subtle smooth rotation
      gsap.to(crosses, { rotation: 180, duration: 2.2, ease: 'power2.inOut', stagger: 0.08 })

      const tl = gsap.timeline({ defaults: { ease: 'power2.out' } })

      // 1. Crosshairs & subtle ambient backdrop bloom
      tl.fromTo(crosses, { scale: 0, opacity: 0 }, { scale: 1, opacity: 0.35, duration: 0.6, stagger: 0.06, ease: 'back.out(1.7)' }, 0)
        .fromTo('.intro-glow', { scale: 0.6, opacity: 0 }, { scale: 1, opacity: 1, duration: 1.2, ease: 'power2.out' }, 0.05)

      // 2. Apple "hello" style continuous fluid handwriting animation
      // Stroke 1: R Primary Diagonal Slash (dynamic backbone)
      if (strokes[0]) {
        tl.to(strokes[0], { strokeDashoffset: 0, duration: 0.42, ease: 'power2.out' }, 0.15)
      }
      // Stroke 2: R Cursive Arch, Upper Bowl, and DOWNWARD Tail (unmistakable R, not P!)
      if (strokes[1]) {
        tl.to(strokes[1], { strokeDashoffset: 0, duration: 0.85, ease: 'power1.inOut' }, 0.52)
      }
      // Stroke 3: K Italic Stem Slash
      if (strokes[2]) {
        tl.to(strokes[2], { strokeDashoffset: 0, duration: 0.42, ease: 'power2.out' }, 1.32)
      }
      // Stroke 4: K Upper Diagonal Arm
      if (strokes[3]) {
        tl.to(strokes[3], { strokeDashoffset: 0, duration: 0.28, ease: 'power2.out' }, 1.68)
      }
      // Stroke 5: K Lower Arm & Majestic Underline Flourish gliding across to the right
      if (strokes[4]) {
        tl.to(strokes[4], { strokeDashoffset: 0, duration: 0.78, ease: 'power2.out' }, 1.88)
      }

      // 3. Typographic reveal: RAJEEV KUMAR on top, DIRECTOR OF PHOTOGRAPHY below
      tl.fromTo(
        '.intro-name',
        { y: 14, opacity: 0, letterSpacing: '0.22em' },
        { y: 0, opacity: 1, letterSpacing: '0.38em', duration: 0.75, ease: 'power3.out' },
        2.45
      )
      tl.fromTo(
        '.intro-role',
        { y: 10, opacity: 0, letterSpacing: '0.18em' },
        { y: 0, opacity: 0.85, letterSpacing: '0.28em', duration: 0.75, ease: 'power3.out' },
        2.68
      )

      // Hold briefly so user enjoys the completed signature title card
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
              filter: 'blur(20px)',
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
          <svg className="intro-hello-svg" viewBox={signatureViewBox} fill="none">
            {signatureStrokes.map((d, i) => (
              <path
                key={i}
                className={`intro-hello-stroke intro-hello-stroke--${i + 1}`}
                d={d}
                stroke="#f4eee4"
                strokeWidth="4.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            ))}
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
