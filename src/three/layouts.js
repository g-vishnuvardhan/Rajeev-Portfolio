// Position/rotation generators for each gallery layout with enlarged frame spacing.
const rand = (i, s) => {
  const x = Math.sin(i * 127.1 + s * 311.7) * 43758.5453
  return x - Math.floor(x)
}

export const layouts = {
  wall: (i) => {
    const cols = 4
    const c = i % cols
    const r = Math.floor(i / cols)
    const x = (c - (cols - 1) / 2) * 3.8
    return { p: [x, (0.5 - r) * 3.8, -Math.abs(x) * 0.25], r: [0, -x * 0.05, 0] }
  },
  ring: (i, n) => {
    const a = (i / n) * Math.PI * 2
    return { p: [Math.sin(a) * 6.5, 0, Math.cos(a) * 6.5], r: [0, a, 0] }
  },
  helix: (i, n) => {
    const a = i * 0.85
    return { p: [Math.sin(a) * 4.2, (i - (n - 1) / 2) * 1.35, Math.cos(a) * 4.2], r: [0, a, 0] }
  },
  scatter: (i) => ({
    p: [(rand(i, 1) - 0.5) * 12, (rand(i, 2) - 0.5) * 6.5, (rand(i, 3) - 0.5) * 6],
    r: [(rand(i, 4) - 0.5) * 0.3, (rand(i, 5) - 0.5) * 0.6, (rand(i, 6) - 0.5) * 0.2],
  }),
  tunnel: (i) => ({
    p: [Math.sin(i * 1.3) * 3.4, Math.cos(i * 1.7) * 1.6, -i * 3.8],
    r: [0, -Math.sin(i * 1.3) * 0.3, 0],
  }),
  arc: (i, n) => {
    const t = i - (n - 1) / 2
    return { p: [t * 3.3, Math.sin(i * 0.9) * 0.35, -Math.abs(t) * 1.1], r: [0, -t * 0.16, 0] }
  },
  orbit: (i, n) => {
    const ring = i % 2
    const k = Math.floor(i / 2)
    const m = Math.ceil(n / 2)
    const a = (k / m) * Math.PI * 2 + ring * 0.6
    const R = ring ? 4.2 : 6.8
    return { p: [Math.sin(a) * R, ring ? 2.2 : -1.6, Math.cos(a) * R], r: [0, a, 0] }
  },
  cascade: (i, n) => ({
    p: [(i - (n - 1) / 2) * 2.2, ((n - 1) / 2 - i) * 1.0, -i * 1.2],
    r: [0, -0.35, 0],
  }),
}

// Base z offset of the whole group per layout
export const layoutZ = { wall: 0, ring: -6.2, helix: -3.8, scatter: 0, tunnel: 2, arc: 0.3, orbit: -5.5, cascade: 1 }
