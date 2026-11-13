// Position/rotation generators for each gallery layout.
const rand = (i, s) => {
  const x = Math.sin(i * 127.1 + s * 311.7) * 43758.5453
  return x - Math.floor(x)
}

export const layouts = {
  wall: (i) => {
    const cols = 4
    const c = i % cols
    const r = Math.floor(i / cols)
    const x = (c - (cols - 1) / 2) * 2.8
    return { p: [x, (0.5 - r) * 2.8, -Math.abs(x) * 0.25], r: [0, -x * 0.06, 0] }
  },
  ring: (i, n) => {
    const a = (i / n) * Math.PI * 2
    return { p: [Math.sin(a) * 5, 0, Math.cos(a) * 5], r: [0, a, 0] }
  },
  helix: (i, n) => {
    const a = i * 0.85
    return { p: [Math.sin(a) * 3.4, (i - (n - 1) / 2) * 0.95, Math.cos(a) * 3.4], r: [0, a, 0] }
  },
  scatter: (i) => ({
    p: [(rand(i, 1) - 0.5) * 10, (rand(i, 2) - 0.5) * 5, (rand(i, 3) - 0.5) * 6],
    r: [(rand(i, 4) - 0.5) * 0.3, (rand(i, 5) - 0.5) * 0.6, (rand(i, 6) - 0.5) * 0.2],
  }),
  tunnel: (i) => ({
    p: [Math.sin(i * 1.3) * 2.6, Math.cos(i * 1.7) * 1.2, -i * 3],
    r: [0, -Math.sin(i * 1.3) * 0.3, 0],
  }),
  arc: (i, n) => {
    const t = i - (n - 1) / 2
    return { p: [t * 2.3, Math.sin(i * 0.9) * 0.3, -Math.abs(t) * 0.8], r: [0, -t * 0.18, 0] }
  },
  orbit: (i, n) => {
    const ring = i % 2
    const k = Math.floor(i / 2)
    const m = Math.ceil(n / 2)
    const a = (k / m) * Math.PI * 2 + ring * 0.6
    const R = ring ? 3.2 : 5.2
    return { p: [Math.sin(a) * R, ring ? 1.7 : -1.2, Math.cos(a) * R], r: [0, a, 0] }
  },
  cascade: (i, n) => ({
    p: [(i - (n - 1) / 2) * 1.5, ((n - 1) / 2 - i) * 0.7, -i * 0.9],
    r: [0, -0.35, 0],
  }),
}

// Base z offset of the whole group per layout
export const layoutZ = { wall: 0, ring: -5, helix: -3, scatter: 0, tunnel: 2, arc: 0, orbit: -4, cascade: 1 }
