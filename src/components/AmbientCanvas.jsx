import { useEffect, useRef } from 'react'
import { useEnv } from '../lib/env'

// Lightweight 60fps cursor- & scroll-reactive particle & volumetric light-field canvas
export default function AmbientCanvas() {
  const canvasRef = useRef(null)
  const env = useEnv()

  useEffect(() => {
    if (env.reduced || env.lowEnd) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d', { alpha: true })
    if (!ctx) return

    let w = (canvas.width = window.innerWidth)
    let h = (canvas.height = window.innerHeight)
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5)
    canvas.width = w * dpr
    canvas.height = h * dpr
    ctx.scale(dpr, dpr)

    const count = env.mobile ? 28 : 56
    const particles = Array.from({ length: count }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      z: 0.3 + Math.random() * 0.9,
      r: 0.6 + Math.random() * 1.4,
      vx: (Math.random() - 0.5) * 0.16,
      vy: (Math.random() - 0.5) * 0.14 - 0.05,
      warm: Math.random() > 0.45,
      alpha: 0.12 + Math.random() * 0.35,
    }))

    const mouse = { x: w * 0.65, y: h * 0.45, tx: w * 0.65, ty: h * 0.45 }
    let lastScroll = window.scrollY
    let scrollVel = 0

    const onResize = () => {
      w = window.innerWidth
      h = window.innerHeight
      canvas.width = w * dpr
      canvas.height = h * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }

    const onMouse = (e) => {
      mouse.tx = e.clientX
      mouse.ty = e.clientY
    }

    const onScroll = () => {
      const y = window.scrollY
      scrollVel += (y - lastScroll) * 0.12
      lastScroll = y
    }

    window.addEventListener('resize', onResize)
    window.addEventListener('mousemove', onMouse, { passive: true })
    window.addEventListener('scroll', onScroll, { passive: true })

    let raf = 0
    const render = () => {
      ctx.clearRect(0, 0, w, h)

      mouse.x += (mouse.tx - mouse.x) * 0.06
      mouse.y += (mouse.ty - mouse.y) * 0.06
      scrollVel *= 0.92

      // Subtle interactive volumetric cursor halo
      if (!env.mobile) {
        const g = ctx.createRadialGradient(mouse.x, mouse.y, 0, mouse.x, mouse.y, 260)
        g.addColorStop(0, 'rgba(224, 176, 116, 0.055)')
        g.addColorStop(0.5, 'rgba(208, 86, 48, 0.02)')
        g.addColorStop(1, 'rgba(0, 0, 0, 0)')
        ctx.fillStyle = g
        ctx.fillRect(0, 0, w, h)
      }

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i]
        p.x += p.vx
        p.y += p.vy - scrollVel * 0.25 * p.z

        if (p.x < -10) p.x = w + 10
        if (p.x > w + 10) p.x = -10
        if (p.y < -10) p.y = h + 10
        if (p.y > h + 10) p.y = -10

        const dx = p.x - mouse.x
        const dy = p.y - mouse.y
        const dist = Math.hypot(dx, dy)
        const boost = dist < 180 ? (1 - dist / 180) * 0.35 : 0

        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r + boost * 1.2, 0, Math.PI * 2)
        ctx.fillStyle = p.warm
          ? `rgba(224, 176, 116, ${p.alpha + boost})`
          : `rgba(244, 242, 238, ${(p.alpha + boost) * 0.7})`
        ctx.fill()
      }

      raf = requestAnimationFrame(render)
    }

    raf = requestAnimationFrame(render)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', onResize)
      window.removeEventListener('mousemove', onMouse)
      window.removeEventListener('scroll', onScroll)
    }
  }, [env.reduced, env.lowEnd, env.mobile])

  if (env.reduced || env.lowEnd) return null
  return <canvas ref={canvasRef} className="ambient-canvas" aria-hidden="true" />
}
