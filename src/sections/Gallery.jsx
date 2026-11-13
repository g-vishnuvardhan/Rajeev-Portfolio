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
  const [openIndex, setOpenIndex] = useState(null)
  const [hover, setHover] = useState(null)
  const [visible, setVisible] = useState(false)
  const root = useRef()
  const stage = useRef()
  const use3D = env.webgl && !env.reduced && !env.lowEnd

  const catIndex = categories.findIndex((c) => c.id === catId)
  const category = categories[catIndex]

  const items = useMemo(
    () =>
      photos[catId].map((p, i) => ({
        ...p,
        url: resolveSrc(p.src, i + catIndex, p.ratio, `${category.name} — photograph slot ${i + 1}`),
      })),
    [catId, catIndex, category.name]
  )

  useEffect(() => {
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { threshold: 0.05 })
    io.observe(stage.current)
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

  return (
    <section id="work" className="gallery" ref={root}>
      <header className="section-head">
        <h2>Gallery</h2>
        <p>{category.blurb}</p>
      </header>

      <div className="tabs" role="group" aria-label="Photography categories">
        {categories.map((c) => (
          <button key={c.id} className="tab" aria-pressed={c.id === catId} onClick={() => setCatId(c.id)}>
            {c.name}
          </button>
        ))}
      </div>

      <div className="stage" ref={stage}>
        {use3D ? (
          <Suspense fallback={<p className="stage-note">Loading gallery</p>}>
            <GalleryScene
              items={items}
              layout={category.layout}
              visible={visible}
              mobile={env.mobile}
              onOpen={setOpenIndex}
              onHover={setHover}
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
        {use3D && (
          <>
            <p className="stage-title" aria-hidden="true">
              {hover !== null ? items[hover].title || `${category.name} ${String(hover + 1).padStart(2, '0')}` : ''}
            </p>
            <p className="stage-hint" aria-hidden="true">
              {env.mobile ? 'Swipe to turn · Tap to open' : 'Move to look around · Drag to turn · Click to open'}
            </p>
          </>
        )}
      </div>

      {use3D && (
        <ul className="sr-only">
          {items.map((it, i) => (
            <li key={i}>
              <button onClick={() => setOpenIndex(i)}>Open {category.name} photograph {i + 1}</button>
            </li>
          ))}
        </ul>
      )}

      <Lightbox items={items} index={openIndex} onClose={() => setOpenIndex(null)} onIndex={setOpenIndex} category={category.name} />
    </section>
  )
}
