import { useEffect, useState } from 'react'
import { nav, site } from '../data/content'
import { scrollToId } from '../lib/smooth'
import RKLogo from './RKLogo'
import { Magnetic, RollText } from './Magnetic'

export default function Nav({ ready = true }) {
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState('home')
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const ids = nav.map((n) => n.id)
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && setActive(e.target.id)),
      { rootMargin: '-45% 0px -50% 0px' }
    )
    ids.forEach((id) => document.getElementById(id) && io.observe(document.getElementById(id)))

    const onScroll = () => setScrolled(window.scrollY > 36)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })

    return () => {
      io.disconnect()
      window.removeEventListener('scroll', onScroll)
    }
  }, [])

  const go = (id) => (e) => {
    e.preventDefault()
    setOpen(false)
    scrollToId(id)
  }

  return (
    <header className={`nav ${scrolled ? 'is-scrolled' : ''}`}>
      <Magnetic strength={0.32}>
        <a
          className="nav-logo"
          href="#home"
          onClick={go('home')}
          aria-label={`${site.name} — home`}
          style={{ opacity: ready ? 1 : 0, transition: 'opacity 0.25s ease' }}
        >
          <RKLogo size="sm" />
        </a>
      </Magnetic>
      <button className="nav-toggle" aria-expanded={open} aria-controls="menu" onClick={() => setOpen(!open)}>
        {open ? 'Close' : 'Menu'}
      </button>
      <nav id="menu" className={open ? 'nav-menu is-open' : 'nav-menu'} aria-label="Primary">
        <ul>
          {nav.map((n) => (
            <li key={n.id}>
              <a href={`#${n.id}`} onClick={go(n.id)} aria-current={active === n.id ? 'true' : undefined}>
                <RollText text={n.label} />
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  )
}
