import { useLayoutEffect } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useEnv } from './env'

gsap.registerPlugin(ScrollTrigger)

// Runs `fn` inside a gsap context scoped to `scope`. Skipped entirely for reduced motion.
export function useGsap(fn, scope, deps = []) {
  const env = useEnv()
  useLayoutEffect(() => {
    if (env.reduced) return
    const ctx = gsap.context(() => fn(env), scope)
    return () => ctx.revert()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [env.reduced, ...deps])
}

export { gsap, ScrollTrigger }
