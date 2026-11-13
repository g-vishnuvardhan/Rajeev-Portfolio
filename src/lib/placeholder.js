// Generates sleek obsidian-glass placeholder images (no stock or random photos).
const TONES = [
  [14, 16, 22],
  [22, 16, 15],
  [13, 18, 20],
  [19, 15, 20],
  [16, 16, 18],
]

export function placeholder(seed = 0, ratio = 1, label = 'Photograph placeholder') {
  const h = 1000
  const w = Math.round(h * ratio)
  const [r, g, b] = TONES[Math.abs(seed) % TONES.length]
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='${w}' height='${h}' viewBox='0 0 ${w} ${h}'>
<defs>
<linearGradient id='g' x1='0' y1='0' x2='1' y2='1'><stop offset='0' stop-color='rgb(${r + 16},${g + 16},${b + 18})'/><stop offset='1' stop-color='rgb(${r - 6},${g - 6},${b - 6})'/></linearGradient>
<radialGradient id='l' cx='.3' cy='.25' r='.75'><stop offset='0' stop-color='rgb(226,182,121)' stop-opacity='.12'/><stop offset='1' stop-color='black' stop-opacity='0'/></radialGradient>
</defs>
<rect width='100%' height='100%' fill='url(#g)'/><rect width='100%' height='100%' fill='url(#l)'/>
<rect x='${w * 0.04}' y='${h * 0.04}' width='${w * 0.92}' height='${h * 0.92}' fill='none' stroke='white' stroke-opacity='.09' stroke-width='1.5'/>
<circle cx='${w / 2}' cy='${h / 2}' r='28' fill='none' stroke='white' stroke-opacity='.12' stroke-width='1.2'/>
<circle cx='${w / 2}' cy='${h / 2}' r='3' fill='rgb(226,182,121)' fill-opacity='.45'/>
<text x='50%' y='${h * 0.91}' text-anchor='middle' font-family='sans-serif' font-size='${Math.max(20, w * 0.026)}' fill='white' fill-opacity='.34' letter-spacing='3'>${label}</text>
</svg>`
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg)
}

export const resolveSrc = (src, seed, ratio, label) => src || placeholder(seed, ratio, label)
