import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { categories, photos } from '../data/gallery'
import { resolveSrc } from '../lib/placeholder'
import { useEnv } from '../lib/env'
import { useGsap, gsap } from '../lib/useGsap'
import Lightbox from '../components/Lightbox'

const GalleryScene = lazy(() => import('../three/GalleryScene'))

export default function Gallery() {
  const env = useEnv()
  const [catId, setCatId] = useState(categories[0].id)
  const [activeIndex, setActiveIndex] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const [openIndex, setOpenIndex] = useState(null)
  const [hover, setHover] = useState(null)
  const [visible, setVisible] = useState(false)
  const root = useRef()
  const stage = useRef()
  const use3D = env.webgl && !env.reduced && !env.lowEnd

  const catIndex = categories.findIndex((c) => c.id === catId)
  const category = categories[catIndex] || categories[0]

  const items = useMemo(
    () =>
      (photos[catId] || []).map((p, i) => ({
        ...p,
        url: resolveSrc(p.src, i + catIndex, p.ratio, `${category.name} — photograph slot ${i + 1}`),
      })),
    [catId, catIndex, category.name]
  )

  // Reset active frame when switching category
  const handleCatChange = (id) => {
    setCatId(id)
    setActiveIndex(0)
    setHover(null)
  }

  // Automatic moving of frames every 3.5 seconds
  useEffect(() => {
    if (!visible || openIndex !== null || isPaused || items.length === 0) return
    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % items.length)
    }, 3500)
    return () => clearInterval(timer)
  }, [visible, openIndex, isPaused, items.length, catId])

  const prevFrame = (e) => {
    e?.stopPropagation()
    setActiveIndex((prev) => (prev - 1 + items.length) % items.length)
  }

  const nextFrame = (e) => {
    e?.stopPropagation()
    setActiveIndex((prev) => (prev + 1) % items.length)
  }

  useEffect(() => {
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { threshold: 0.05 })
    if (stage.current) io.observe(stage.current)
    return () => io.disconnect()
  }, [])

  useGsap(() => {
    gsap.from('.gallery .section-head', {
      y: 36, opacity: 0, duration: 1, ease: 'expo.out',
      scrollTrigger: { trigger: root.current, start: 'top 82%' },
    })
    gsap.from('.gallery .tab', {
      y: 20, opacity: 0, duration: 0.7, stagger: 0.06, ease: 'power3.out',
      scrollTrigger: { trigger: '.gallery .tabs', start: 'top 86%' },
    })
    gsap.from('.gallery .stage', {
      scale: 0.96, opacity: 0, duration: 1.15, ease: 'expo.out',
      scrollTrigger: { trigger: '.gallery .stage', start: 'top 86%' },
    })
  }, root)

  const activeTitle = items[activeIndex]?.title || `${category.name} — Frame ${String(activeIndex + 1).padStart(2, '0')}`

  return (
    <section id="work" className="gallery" ref={root}>
      <header className="section-head">
        <h2>Gallery</h2>
        <p>{category.blurb}</p>
      </header>

      <div className="tabs" role="group" aria-label="Photography categories">
        {categories.map((c) => (
          <button key={c.id} className="tab" aria-pressed={c.id === catId} onClick={() => handleCatChange(c.id)}>
            {c.name}
          </button>
        ))}
      </div>

      <div
        className="stage"
        ref={stage}
        onPointerEnter={() => setIsPaused(true)}
        onPointerLeave={() => setIsPaused(false)}
      >
        {use3D ? (
          <Suspense fallback={<p className="stage-note">Loading gallery</p>}>
            <GalleryScene
              items={items}
              layout={category.layout}
              activeIndex={activeIndex}
              visible={visible}
              mobile={env.mobile}
              onOpen={setOpenIndex}
              onHover={(idx) => {
                setHover(idx)
                if (idx !== null) setActiveIndex(idx)
              }}
            />
          </Suspense>
        ) : (
          <ul className="flat-grid">
            {items.map((it, i) => (
              <li key={i}>
                <button onClick={() => setOpenIndex(i)} aria-label={`Open ${category.name} photograph ${i + 1}`}>
                  <img src={it.url} alt="" loading="lazy" style={{ aspectRatio: it.ratio }} />
                </button>
              </li>
            ))}
          </ul>
        )}

        <p className="stage-title" aria-hidden="true">
          {activeTitle}
        </p>

        <div className="stage-hint" aria-hidden="true">
          <span className="stage-hint-dot" />
          <span>{env.mobile ? 'Auto-playing 3.5s · Tap to open' : 'Auto-advancing 3.5s · Click frame to open'}</span>
        </div>

        <div className="stage-counter" aria-label={`Frame ${activeIndex + 1} of ${items.length}`}>
          <button className="stage-nav-btn" onClick={prevFrame} aria-label="Previous frame">‹</button>
          <span className="stage-counter-num">{String(activeIndex + 1).padStart(2, '0')} / {String(items.length).padStart(2, '0')}</span>
          <div className="stage-progress">
            <div key={`${catId}-${activeIndex}`} className={`stage-progress-fill ${isPaused ? 'is-paused' : ''}`} />
          </div>
          <button className="stage-nav-btn" onClick={nextFrame} aria-label="Next frame">›</button>
        </div>
      </div>

      <ul className="sr-only">
        {items.map((it, i) => (
          <li key={i}>
            <button onClick={() => setOpenIndex(i)}>Open {category.name} photograph {i + 1}</button>
          </li>
        ))}
      </ul>

      <Lightbox items={items} index={openIndex} onClose={() => setOpenIndex(null)} onIndex={setOpenIndex} category={category.name} />
    </section>
  )
}
