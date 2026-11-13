// All text content lives here. Edit freely — nothing else needs to change.

export const site = {
  name: 'Rajeev Kumar',
  role: 'Director of Photography',
  tagline: 'Cinematographer · Photographer · Visual Storyteller',
  location: 'Hyderabad, India',
  fullLocation: 'Hyderabad, Telangana, India',
  phone: '+91 9100305010',
  phoneHref: 'tel:+919100305010',
  email: 'gantyalarajeevkumar@gmail.com',
  whatsapp: 'https://wa.me/919100305010',
  instagram: '', // paste the real Instagram URL here when available
}

export const nav = [
  { id: 'home', label: 'Home' },
  { id: 'work', label: 'Work' },
  { id: 'about', label: 'About' },
  { id: 'expertise', label: 'Expertise' },
  { id: 'contact', label: 'Contact' },
]

// Hero background. Set src to a photo URL (e.g. '/photos/hero.jpg') or a video ('/photos/hero.mp4').
export const heroMedia = { type: 'image', src: '/photos/hero-rajeev.jpg' }

// Floating frames in the hero. Set src to '/photos/hero-1.jpg' etc. to use real photographs.
export const heroFrames = [
  { src: null, ratio: 0.8, pos: [-5.4, 1.3, -1.5], rot: [0, 0.4, 0.03], speed: 0.5 },
  { src: null, ratio: 1.6, pos: [5.2, 1.6, -2.5], rot: [0, -0.4, -0.03], speed: 0.4 },
  { src: null, ratio: 0.8, pos: [-3.2, -2.2, 0.5], rot: [0, 0.25, -0.04], speed: 0.6 },
  { src: null, ratio: 1.2, pos: [3.6, -2.0, 0.2], rot: [0, -0.3, 0.05], speed: 0.55 },
  { src: null, ratio: 0.8, pos: [0.4, 3.0, -4], rot: [0, 0, 0.02], speed: 0.35 },
  { src: null, ratio: 1.6, pos: [-7.2, -1.2, -4], rot: [0, 0.6, 0], speed: 0.3 },
  { src: null, ratio: 0.8, pos: [7.4, -0.8, -4.5], rot: [0, -0.6, 0], speed: 0.45 },
]

export const about = {
  quote: 'Every frame tells a story. Every light creates a mood. Every movement brings a vision to life.',
  titleLine: 'Director of Photography | Cinematographer | Photographer',
  photo: null, // '/photos/rajeev-portrait.jpg'
  profile: [
    'Visual-driven Director of Photography and Cinematographer with 4 years of practical experience across commercial, fashion, portrait and creative productions.',
    'Skilled in camera operation, cinematic lighting, framing, lens selection, camera movement and visual storytelling.',
    'Experienced in adapting visual language to different formats, including films, web series, short films, brand campaigns, model shoots, reels, interior and outdoor productions.',
  ],
}

export const expertise = [
  {
    title: 'Camera systems',
    text: 'Hands-on with the cameras used across commercial, fashion and film sets.',
    items: ['Sony', 'Canon', 'Nikon', 'ARRI', 'RED', 'Blackmagic'],
  },
  {
    title: 'Cinematography',
    text: 'Framing, composition, lens selection, exposure, camera movement, rigging and shot execution.',
    items: ['Framing', 'Composition', 'Lens selection', 'Exposure', 'Camera movement', 'Rigging', 'Shot execution'],
  },
  {
    title: 'Lighting',
    text: 'Key lighting, fill lighting, backlighting and practical lighting, shaped for mood, contrast, depth and subject separation.',
    items: ['Key', 'Fill', 'Backlight', 'Practicals', 'Mood', 'Contrast', 'Depth', 'Separation'],
  },
  {
    title: 'Visual planning',
    text: 'Shot design, scene staging and visual continuity — turning creative concepts into visuals that can be executed on set.',
    items: ['Shot design', 'Scene staging', 'Visual continuity', 'Concept to execution'],
  },
]

export const experience = {
  title: 'Photographer & Cinematographer',
  company: 'SSKL',
  duration: '4 years of experience',
  responsibilities: [
    'Led camera operations and visual framing for commercial, portrait and creative productions.',
    'Designed and executed cinematic lighting setups.',
    'Worked with creative teams to translate concepts and scripts into dynamic shot sequences.',
    'Managed camera preparation, rigging, lens selection and on-set visual execution.',
    'Supported post-production workflows with attention to colour balance and visual consistency.',
  ],
}

export const production = [
  { title: 'Films', text: 'Camera and cinematography support for movie productions.', src: null },
  { title: 'Web Series', text: 'Visual production and cinematic coverage for episodic digital content.', src: null },
  { title: 'Short Films', text: 'Story-focused cinematography and visual composition.', src: null },
  { title: 'Fashion & Model Shoots', text: 'Professional fashion, model and portfolio shoots.', src: null },
  { title: 'Reels & Social Content', text: 'Cinematic promotional reels and branded content.', src: null },
  { title: 'Interior & Outdoor Productions', text: 'Commercial interiors, lifestyle spaces and outdoor campaigns.', src: null },
]

// Typeset names only. Add logo files later if authentic assets are supplied.
export const brands = [
  'Kalamandir',
  'Valli',
  'KLM Fashion Mall',
  'Rasamayi Jewelry',
  'Tarasya Jewelry',
  'Bahar Cafe',
  'Kanchipuram Varamahalakshmi Silks',
  'Coco Time',
]

export const capabilities = [
  { title: 'Fashion & Jewellery Photography', src: null },
  { title: 'Brand Campaigns', src: null },
  { title: 'Model Photography', src: null },
  { title: 'Reels & Short-Form Content', src: null },
  { title: 'Interior Photography', src: null },
  { title: 'Outdoor Productions', src: null },
]
