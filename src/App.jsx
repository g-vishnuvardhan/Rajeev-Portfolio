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
  const checkIsAdmin = () => {
    const p = window.location.pathname
    const h = window.location.hash
    return p === '/admin' || p.startsWith('/admin') || h.startsWith('#/admin') || h.startsWith('#admin')
  }

  const [isAdmin, setIsAdmin] = useState(checkIsAdmin)

  useEffect(() => {
    const handleRoute = () => {
      setIsAdmin(checkIsAdmin())
    }
    window.addEventListener('popstate', handleRoute)
    window.addEventListener('hashchange', handleRoute)

    // Secret Admin shortcut: Press Ctrl + Shift + A (or Cmd + Shift + A) to access the separate admin page
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'A' || e.key === 'a')) {
        e.preventDefault()
        window.location.hash = '#/admin'
      }
    }
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('popstate', handleRoute)
      window.removeEventListener('hashchange', handleRoute)
      window.removeEventListener('keydown', handleKeyDown)
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
              <About />
              <Gallery />
              <HandledProjects />
              <Contact />
            </main>
          </>
        )}
      </DataProvider>
    </EnvContext.Provider>
  )
}
