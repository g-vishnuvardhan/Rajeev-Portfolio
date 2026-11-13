// Mathematically pure cubic Bezier curves for the bespoke "RK" signature
// Specifically crafted with an unmistakable downward descending R leg (↓) and buttery Apple "hello" monoline flow.

export const signatureViewBox = '35 15 510 240'

export const signatureStrokes = [
  // 1. R Primary Diagonal Slash (dynamic anchor backbone)
  'M 185 35 C 155 95 115 165 75 235',

  // 2. R Cursive Arch, Upper Bowl, and DOWNWARD Leg / Tail (unmistakable 'R', not 'P')
  'M 50 145 C 68 105 105 52 148 38 C 180 28 218 52 212 88 C 205 118 165 132 132 126 C 144 152 160 205 178 226 C 192 235 212 225 238 195',

  // 3. K Italic Stem Slash (parallel dynamic slope)
  'M 275 35 C 255 90 232 150 205 220',

  // 4. K Upper Diagonal Arm
  'M 224 136 C 245 120 270 102 298 92',

  // 5. K Lower Arm & Majestic Underline Flourish
  'M 224 136 C 240 160 255 185 275 190 C 315 195 395 180 465 172 C 495 168 518 168 530 168',
]
