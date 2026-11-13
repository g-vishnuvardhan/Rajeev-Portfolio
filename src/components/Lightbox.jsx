import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { useEnv } from '../lib/env'
import { stopScroll, startScroll } from '../lib/smooth'

export default function Lightbox({ items, index, onClose, onIndex, category }) {
  const env = useEnv()
  const root = useRef()
  const img = useRef()
  const closeBtn = useRef()
  const open = index !== null
  const lastFocus = useRef(null)

  // lock scroll + focus management
  useEffect(() => {
    if (!open) return
    lastFocus.current = document.activeElement
    stopScroll()
    document.body.style.overflow = 'hidden'
    closeBtn.current?.focus()
    if (!env.reduced) gsap.fromTo(root.current, { opacity: 0 }, { opacity: 1, duration: 0.45, ease: 'power2.out' })
    return () => {
      startScroll()
      document.body.style.overflow = ''
      lastFocus.current?.focus?.()
    }
  }, [open, env.reduced])

  // image transition on index change
  useEffect(() => {
    if (!open || env.reduced || !img.current) return
    gsap.fromTo(
      img.current,
      { opacity: 0, scale: 0.9, rotateY: -10, transformPerspective: 1200 },
      { opacity: 1, scale: 1, rotateY: 0, duration: 0.9, ease: 'expo.out' }
    )
  }, [index, open, env.reduced])

  // keyboard
  useEffect(() => {
    if (!open) return
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowRight') onIndex((index + 1) % items.length)
      if (e.key === 'ArrowLeft') onIndex((index - 1 + items.length) % items.length)
      if (e.key === 'Tab') {
        const f = root.current.querySelectorAll('button')
        const first = f[0]
        const last = f[f.length - 1]
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus() }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus() }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, index, items.length, onClose, onIndex])

  if (!open) return null
  const item = items[index]

  const tilt = (e) => {
    if (env.reduced || env.mobile) return
    const px = e.clientX / window.innerWidth - 0.5
    const py = e.clientY / window.innerHeight - 0.5
    gsap.to(img.current, { rotateY: px * 10, rotateX: -py * 8, transformPerspective: 1200, duration: 0.8, ease: 'power3.out' })
  }

  return (
    <div className="lightbox" ref={root} role="dialog" aria-modal="true" aria-label={`${category} photograph ${index + 1} of ${items.length}`} data-lenis-prevent onMouseMove={tilt}>
      <button ref={closeBtn} className="lb-btn lb-close" onClick={onClose} aria-label="Close viewer">Close</button>
      <button className="lb-btn lb-prev" onClick={() => onIndex((index - 1 + items.length) % items.length)} aria-label="Previous photograph">Prev</button>
      <button className="lb-btn lb-next" onClick={() => onIndex((index + 1) % items.length)} aria-label="Next photograph">Next</button>
      <figure className="lb-figure">
        <img ref={img} src={item.url} alt={item.title || `${category} photograph ${index + 1}`} />
        <figcaption>
          <span>{item.title || `${category} — slot ${String(index + 1).padStart(2, '0')}`}</span>
          <span>{index + 1} / {items.length}</span>
        </figcaption>
      </figure>
    </div>
  )
}
