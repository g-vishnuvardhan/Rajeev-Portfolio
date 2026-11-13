# Rajeev Kumar — Cinematic Portfolio

React · Vite · Three.js · React Three Fiber · GSAP · Lenis (smooth scroll)

## Run
```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # production build in /dist
```

## Replace placeholders with real work
| What | File | Notes |
|---|---|---|
| Gallery photos (8 categories) | `src/data/gallery.js` | put images in `public/photos/<category>/`, set `src: '/photos/portrait/01.jpg'` and `ratio` (width/height) |
| Selected Works projects | `src/data/works.js` | titles are placeholders until real projects are supplied |
| Hero background and floating frames | `src/data/content.js` (`heroMedia`, `heroFrames`) | photo or mp4 |
| About portrait, production and capability images | `src/data/content.js` | `src: null` shows a labelled placeholder |
| Instagram link | `src/data/content.js` → `site.instagram` | shown as "link to be added" until set |
| Brand logos | `brands` in `content.js` | typeset names only; add logos only if you have authentic files |

Tip: export photos at ~2000px on the long edge (JPG/WebP, under 400 KB) for fast loading.

## Notes
- No awards, credits, testimonials, project names or social accounts were invented. Salary, age, gender and declaration details are intentionally not shown.
- 3D falls back to a plain image grid if WebGL is unavailable, the device is low-end, or the visitor prefers reduced motion.
- Each 3D canvas pauses rendering while off-screen. On mobile, fewer frames and lower pixel ratio are used.
- The enquiry form opens the visitor's email app (no backend needed). Swap in Formspree/Netlify Forms later if you want in-page sending.
