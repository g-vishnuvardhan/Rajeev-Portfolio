import { useEffect, useRef, useState } from 'react'
import { gsap } from '../lib/useGsap'
import { useEnv } from '../lib/env'

export default function Cursor() {
  const env = useEnv()
  const ring = useRef(null)
  const dot = useRef(null)
  const [label, setLabel] = useState('')
  const [active, setActive] = useState(false)

  useEffect(() => {
    if (env.mobile || env.reduced) return

    const ringEl = ring.current
    const dotEl = dot.current
    if (!ringEl || !dotEl) return

    gsap.set([ringEl, dotEl], { xPercent: -50, yPercent: -50, opacity: 0 })

    const rx = gsap.quickTo(ringEl, 'x', { duration: 0.42, ease: 'power3.out' })
    const ry = gsap.quickTo(ringEl, 'y', { duration: 0.42, ease: 'power3.out' })
    const dx = gsap.quickTo(dotEl, 'x', { duration: 0.12, ease: 'power2.out' })
    const dy = gsap.quickTo(dotEl, 'y', { duration: 0.12, ease: 'power2.out' })

    let shown = false
    const onMove = (e) => {
      if (!shown) {
        shown = true
        gsap.to([ringEl, dotEl], { opacity: 1, duration: 0.3 })
      }
      rx(e.clientX)
      ry(e.clientY)
      dx(e.clientX)
      dy(e.clientY)

      const target = e.target.closest('a, button, [data-cursor], .prod-card, .exp-title, .cap-title')
      if (!target) {
        setActive(false)
        setLabel('')
        return
      }
      setActive(true)
      if (target.dataset?.cursor) setLabel(target.dataset.cursor)
      else if (target.classList.contains('prod-card')) setLabel('VIEW')
      else setLabel('')
    }

    const onLeave = () => {
      shown = false
      gsap.to([ringEl, dotEl], { opacity: 0, duration: 0.25 })
    }

    window.addEventListener('mousemove', onMove, { passive: true })
    document.addEventListener('mouseleave', onLeave)
    return () => {
      window.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseleave', onLeave)
    }
  }, [env.mobile, env.reduced])

  if (env.mobile || env.reduced) return null

  return (
    <>
      <div
        ref={ring}
        className={`cursor-ring ${active ? 'is-active' : ''} ${label ? 'has-label' : ''}`}
        aria-hidden="true"
      >
        {label && <span className="cursor-label">{label}</span>}
      </div>
      <div ref={dot} className={`cursor-dot ${active ? 'is-active' : ''}`} aria-hidden="true" />
    </>
  )
}
