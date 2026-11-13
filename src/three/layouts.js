// Position/rotation generators for each gallery layout.
const rand = (i, s) => {
  const x = Math.sin(i * 127.1 + s * 311.7) * 43758.5453
  return x - Math.floor(x)
}

export const layouts = {
  wall: (i, n = 8) => {
    const cols = n > 8 ? 5 : (n > 4 ? 4 : Math.max(n, 1))
    const c = i % cols
    const r = Math.floor(i / cols)
    const totalRows = Math.ceil(n / cols)
    const x = (c - (cols - 1) / 2) * (cols > 4 ? 2.8 : 3.3)
    const y = ((totalRows - 1) / 2 - r) * 3.1
    return { p: [x, y, -Math.abs(x) * 0.22], r: [0, -x * 0.05, 0] }
  },
  ring: (i, n) => {
    const a = (i / n) * Math.PI * 2
    return { p: [Math.sin(a) * 5.8, 0, Math.cos(a) * 5.8], r: [0, a, 0] }
  },
  helix: (i, n) => {
    const a = (i / n) * Math.PI * 2
    return { p: [Math.sin(a) * 6.0, (i - (n - 1) / 2) * 1.55, Math.cos(a) * 6.0], r: [0, a, 0] }
  },
  scatter: (i) => ({
    p: [(rand(i, 1) - 0.5) * 10.5, (rand(i, 2) - 0.5) * 5.4, (rand(i, 3) - 0.5) * 6],
    r: [(rand(i, 4) - 0.5) * 0.3, (rand(i, 5) - 0.5) * 0.6, (rand(i, 6) - 0.5) * 0.2],
  }),
  tunnel: (i) => {
    const side = i % 2 === 0 ? -1 : 1
    return {
      p: [side * 1.8, 0, -i * 3.4],
      r: [0, -side * 0.15, 0],
    }
  },
  arc: (i, n) => {
    const t = i - (n - 1) / 2
    return { p: [t * 2.75, Math.sin(i * 0.9) * 0.32, -Math.abs(t) * 0.88], r: [0, -t * 0.17, 0] }
  },
  orbit: (i, n) => {
    const ring = i % 2
    const k = Math.floor(i / 2)
    const m = Math.ceil(n / 2)
    const a = (k / m) * Math.PI * 2 + ring * 0.6
    const R = ring ? 3.5 : 5.6
    return { p: [Math.sin(a) * R, ring ? 1.85 : -1.35, Math.cos(a) * R], r: [0, a, 0] }
  },
  cascade: (i, n) => ({
    p: [(i - (n - 1) / 2) * 1.7, ((n - 1) / 2 - i) * 0.78, -i * 0.95],
    r: [0, -0.35, 0],
  }),
}

// Base z offset of the whole group per layout
export const layoutZ = { wall: 0, ring: -5.6, helix: -5.8, scatter: 0, tunnel: 1.5, arc: 0.1, orbit: -4.4, cascade: 1 }
