import { useCallback, useEffect, useMemo, useState } from 'react'
import { detectEnv, EnvContext } from './lib/env'
import { gsap, ScrollTrigger } from './lib/useGsap'
import { initSmooth, startScroll, stopScroll } from './lib/smooth'
import AmbientCanvas from './components/AmbientCanvas'
import IntroLoader from './components/IntroLoader'
import Nav from './components/Nav'
import Hero from './sections/Hero'
import Gallery from './sections/Gallery'
import HandledProjects from './sections/HandledProjects'
import About from './sections/About'
import Contact from './sections/Contact'

export default function App() {
  const env = useMemo(detectEnv, [])
  const [heroReady, setHeroReady] = useState(env.reduced)

  useEffect(() => {
    let dispose = () => {}
    if (!env.reduced) {
      dispose = initSmooth(gsap, ScrollTrigger)
      if (!heroReady) stopScroll()
    }
    const refresh = () => ScrollTrigger.refresh()
    window.addEventListener('load', refresh)
    if (document.fonts?.ready) document.fonts.ready.then(refresh)
    return () => {
      window.removeEventListener('load', refresh)
      dispose()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [env.reduced])

  const handleIntroComplete = useCallback(() => {
    setHeroReady(true)
    startScroll()
    requestAnimationFrame(() => ScrollTrigger.refresh())
  }, [])

  return (
    <EnvContext.Provider value={env}>
      <a className="skip" href="#work">Skip to gallery</a>
      <AmbientCanvas />
      {!env.reduced && <IntroLoader reduced={env.reduced} onComplete={handleIntroComplete} />}
      <Nav ready={heroReady} />
      <main>
        <Hero ready={heroReady} />
        <Gallery />
        <HandledProjects />
        <About />
        <Contact />
      </main>
    </EnvContext.Provider>
  )
}
