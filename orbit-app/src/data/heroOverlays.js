// Hero copy, positions and timing, all in one place.
//
// Timing is in seconds of hero footage (orbit_hero_scrub.mp4), so each block
// is pinned to what is on screen rather than to a scroll distance. A side
// block shows from its `at` until the next block's `at` (the two crossfade);
// the last one stays up until the hero ends.
// `position` maps to a CSS modifier in Hero.css.

// Opening composition (Reference 1): visible on load, fades out at `exitAt`.
export const HERO_OPENING = {
  label: 'Model 01 – ORBIT Eyewear',
  wordmark: 'ORBIT',
  lead: ['Intelligence in sight', 'A new perspective on the world around you.'],
  aside: ['Thoughtful design meets the possibilities', 'of intelligent eyewear'],
  exitAt: 0.1, // as soon as scrolling starts moving the footage
}

export const HERO_OVERLAYS = [
  {
    id: 'new-way-to-see',
    heading: 'A new way to see.',
    body: 'Imagine a more connected perspective on everyday life, where thoughtful technology brings useful information closer while keeping you focused on the world around you.',
    position: 'top-left',
    at: 0.75, // model in three-quarter view, camera drifting
  },
  {
    id: 'beyond-the-obvious',
    heading: 'Look beyond the obvious.',
    body: 'ORBIT explores the meeting point between refined eyewear and intelligent technology, designed around a more natural relationship with the information that matters.',
    position: 'top-right',
    at: 2.0, // head starts turning toward the camera
  },
  {
    id: 'next-perspective',
    heading: 'Meet your next perspective.',
    body: 'Every curve and carefully considered detail reflects a vision of personal technology that feels purposeful, understated, and naturally part of everyday life.',
    position: 'bottom-left',
    at: 3.1, // facing the camera
  },
  {
    id: 'every-angle',
    heading: 'Designed from every angle.',
    body: 'Explore the silhouette, frame, and precision inspired details that bring the ORBIT concept together in one considered design.',
    position: 'bottom-right',
    at: 4.95, // dissolve complete, product rotation begins
  },
  {
    id: 'thoughtfully-integrated',
    heading: 'Technology, thoughtfully integrated.',
    body: 'Beneath the minimal exterior lies a concept exploring how advanced capabilities could fit into everyday eyewear without compromising its clean, understated form.',
    position: 'top-left',
    at: 7.4, // gold circuit glow along the temple arm
  },
  {
    id: 'bigger-picture',
    heading: 'See the bigger picture.',
    body: 'ORBIT brings design and intelligent experiences together in a vision of eyewear that invites you to discover a different way of interacting with the world.',
    position: 'top-right',
    at: 8.95, // return to the front view
  },
]
