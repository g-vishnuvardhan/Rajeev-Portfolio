import { createContext, useContext } from 'react'

function canWebGL() {
  try {
    const c = document.createElement('canvas')
    return !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl')))
  } catch {
    return false
  }
}

export function detectEnv() {
  const mq = (q) => window.matchMedia(q).matches
  const memory = navigator.deviceMemory || 8
  const cores = navigator.hardwareConcurrency || 8
  return {
    reduced: mq('(prefers-reduced-motion: reduce)'),
    mobile: mq('(max-width: 768px)') || mq('(pointer: coarse)'),
    webgl: canWebGL(),
    lowEnd: memory <= 2 || cores <= 2,
  }
}

export const EnvContext = createContext({ reduced: false, mobile: false, webgl: false, lowEnd: false })
export const useEnv = () => useContext(EnvContext)
