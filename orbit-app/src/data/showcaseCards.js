// Section 4 (product showcase) card content. Each card maps to an existing
// feature image in public/assets/features/. The first card is the "hero"
// that transitions from the cinematic video presentation into the card grid.

export const SHOWCASE_CARDS = [
  {
    id: 'everyday-style',
    image: '/assets/features/everyday_style.jpg',
    label: '01 / DESIGN',
    heading: 'Everyday style.',
    body: 'A frame designed to look and feel like premium eyewear. Refined lines and an understated silhouette that fits naturally into any routine.',
  },
  {
    id: 'ai-assistant',
    image: '/assets/features/image_features_ai_assistant.jpg',
    label: '02 / INTELLIGENCE',
    heading: 'AI at a glance.',
    body: 'Calendar, notifications, and contextual information delivered through a discreet heads-up display built into the lens.',
  },
  {
    id: 'navigation',
    image: '/assets/features/feature_navigation.jpg',
    label: '03 / NAVIGATION',
    heading: 'Navigate naturally.',
    body: 'Turn-by-turn directions and media controls projected directly into your field of view, without reaching for your phone.',
  },
  {
    id: 'live-translation',
    image: '/assets/features/feature_live_translation.jpg',
    label: '04 / TRANSLATION',
    heading: 'Translate in real time.',
    body: 'Travel information and live translation displayed through the ORBIT lens, keeping you oriented wherever you go.',
  },
  {
    id: 'smart-awareness',
    video: '/assets/features/smart_capture_video.mp4',
    poster: '/assets/features/feature_smart_capture.jpg',
    label: '05 / AWARENESS',
    heading: 'Sense your surroundings.',
    body: 'Weather, air quality, and environmental data surfaced at the edge of your vision, so you stay aware without checking a screen.',
  },
]
