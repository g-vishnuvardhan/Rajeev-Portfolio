import { useCallback, useEffect, useMemo, useState } from 'react'
import { detectEnv, EnvContext } from './lib/env'
import { gsap, ScrollTrigger } from './lib/useGsap'
import { initSmooth, startScroll, stopScroll } from './lib/smooth'
import { DataProvider } from './context/DataContext'
import AmbientCanvas from './components/AmbientCanvas'
import IntroLoader from './components/IntroLoader'
import Nav from './components/Nav'
import Hero from './sections/Hero'
import Gallery from './sections/Gallery'
import HandledProjects from './sections/HandledProjects'
import About from './sections/About'
import Contact from './sections/Contact'
import Admin from './sections/Admin'

export default function App() {
  const env = useMemo(detectEnv, [])
  const [heroReady, setHeroReady] = useState(env.reduced)
  const [isAdmin, setIsAdmin] = useState(() => {
    return (
      window.location.pathname === '/admin' ||
      window.location.hash.startsWith('#/admin') ||
      window.location.hash.startsWith('#admin')
    )
  })

  useEffect(() => {
    const handleRoute = () => {
      setIsAdmin(
        window.location.pathname === '/admin' ||
        window.location.hash.startsWith('#/admin') ||
        window.location.hash.startsWith('#admin')
      )
    }
    window.addEventListener('popstate', handleRoute)
    window.addEventListener('hashchange', handleRoute)
    return () => {
      window.removeEventListener('popstate', handleRoute)
      window.removeEventListener('hashchange', handleRoute)
    }
  }, [])

  useEffect(() => {
    if (isAdmin) return
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
  }, [env.reduced, isAdmin])

  const handleIntroComplete = useCallback(() => {
    setHeroReady(true)
    startScroll()
    requestAnimationFrame(() => ScrollTrigger.refresh())
  }, [])

  return (
    <EnvContext.Provider value={env}>
      <DataProvider>
        {isAdmin ? (
          <Admin />
        ) : (
          <>
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
          </>
        )}
      </DataProvider>
    </EnvContext.Provider>
  )
}
