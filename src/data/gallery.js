// ---------------------------------------------------------------
// HOW TO ADD REAL PHOTOGRAPHS
// 1. Put image files in /public/photos/<category>/ (e.g. 01.jpg)
// 2. Replace `src: null` with the path, e.g. src: '/photos/portrait/01.jpg'
// 3. Set `ratio` to width / height (portrait 0.8, landscape 1.5, square 1)
// Slots with src: null show a clearly labelled placeholder.
// You can add or remove entries; the layouts adapt automatically.
// ---------------------------------------------------------------

export const categories = [
  { id: 'cinematography', name: 'Cinematography', layout: 'arc', blurb: 'Frames from films, web series and short films.' },
  { id: 'fashion', name: 'Fashion', layout: 'ring', blurb: 'Fashion and model photography.' },
  { id: 'jewellery', name: 'Jewellery', layout: 'scatter', blurb: 'Detail, sparkle and controlled light.' },
  { id: 'portrait', name: 'Portrait', layout: 'wall', blurb: 'Faces, expression and mood.' },
  { id: 'commercial', name: 'Commercial', layout: 'cascade', blurb: 'Brand and campaign photography.' },
  { id: 'interior', name: 'Interior', layout: 'tunnel', blurb: 'Commercial interiors and lifestyle spaces.' },
  { id: 'outdoor', name: 'Outdoor', layout: 'helix', blurb: 'Natural light and outdoor productions.' },
  { id: 'creative', name: 'Creative Projects', layout: 'orbit', blurb: 'Experiments and personal work.' },
]

const ratios = [0.8, 1.5, 0.8, 1.78, 1, 0.8, 1.5, 1.25]
const slots = () => ratios.map((ratio) => ({ src: null, ratio, title: '' }))

export const photos = Object.fromEntries(categories.map((c) => [c.id, slots()]))

// Example of a real entry:
// photos.portrait[0] = { src: '/photos/portrait/01.jpg', ratio: 0.8, title: 'Title of the photograph' }
