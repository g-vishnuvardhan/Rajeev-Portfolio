import Lenis from 'lenis'

let lenis = null

export function initSmooth(gsap, ScrollTrigger) {
  lenis = new Lenis({
    lerp: 0.085,
    smoothWheel: true,
    wheelMultiplier: 0.95,
  })
  lenis.on('scroll', ScrollTrigger.update)
  const tick = (t) => lenis && lenis.raf(t * 1000)
  gsap.ticker.add(tick)
  gsap.ticker.lagSmoothing(500, 33)
  return () => {
    gsap.ticker.remove(tick)
    lenis.destroy()
    lenis = null
  }
}

export function scrollToId(id) {
  const el = document.getElementById(id)
  if (!el) return
  if (lenis) lenis.scrollTo(el, { offset: -20, duration: 1.35 })
  else el.scrollIntoView({ behavior: 'smooth' })
}

export const stopScroll = () => lenis && lenis.stop()
export const startScroll = () => lenis && lenis.start()
