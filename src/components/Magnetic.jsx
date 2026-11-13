import { useRef } from 'react'
import { gsap, useGsap } from '../lib/useGsap'
import { useEnv } from '../lib/env'

export function Magnetic({ children, strength = 0.28, className = '' }) {
  const ref = useRef(null)
  const env = useEnv()

  useGsap(() => {
    if (env.mobile || env.reduced) return
    const el = ref.current
    if (!el) return
    const xTo = gsap.quickTo(el, 'x', { duration: 0.55, ease: 'elastic.out(1, 0.45)' })
    const yTo = gsap.quickTo(el, 'y', { duration: 0.55, ease: 'elastic.out(1, 0.45)' })

    const onMove = (e) => {
      const r = el.getBoundingClientRect()
      const dx = (e.clientX - (r.left + r.width / 2)) * strength
      const dy = (e.clientY - (r.top + r.height / 2)) * strength
      xTo(dx)
      yTo(dy)
    }
    const onLeave = () => {
      xTo(0)
      yTo(0)
    }

    el.addEventListener('mousemove', onMove)
    el.addEventListener('mouseleave', onLeave)
    return () => {
      el.removeEventListener('mousemove', onMove)
      el.removeEventListener('mouseleave', onLeave)
    }
  }, ref, [env.mobile, env.reduced, strength])

  return (
    <span ref={ref} className={`magnetic ${className}`.trim()}>
      {children}
    </span>
  )
}

export function RollText({ text }) {
  return (
    <span className="roll-text">
      <span className="roll-text-main">{text}</span>
      <span className="roll-text-clone" aria-hidden="true">{text}</span>
    </span>
  )
}
