// Section 2 (product reveal) copy, positions, timing and framing, all in one
// place. Timing is in seconds of closeup footage (orbit_closeup_scrub.mp4).
// A block shows from its `at` until the next block's `at` (the two
// crossfade); the last one stays up until the section ends.
// `position` maps to a CSS modifier in ProductReveal.css.

export const REVEAL_OVERLAYS = [
  {
    id: 'new-signal',
    label: 'ORBIT / INTELLIGENT EYEWEAR',
    heading: 'A new signal.',
    body: 'Technology is evolving beyond the screens we carry and the devices we hold. ORBIT explores a more natural way to bring intelligent experiences closer to everyday life, integrating thoughtful technology into a form designed to feel as familiar as the eyewear we already know.',
    position: 'top-left',
    at: 0.4, // macro shot: the red pixel display is the focus
  },
  {
    id: 'in-sight',
    heading: 'Intelligence, in sight.',
    body: 'Every detail begins with a simple idea: technology should feel like a natural extension of the person using it. From the refined frame to the carefully integrated temple details, ORBIT explores how intelligent eyewear can bring design and digital experiences together without demanding more of your attention.',
    position: 'top-right',
    at: 3.6, // camera opens up: brushed metal and ORBIT branding
  },
  {
    id: 'meet-orbit',
    heading: 'Meet ORBIT.',
    body: 'Designed around a different perspective on personal technology, ORBIT brings together a considered silhouette, refined materials, and the possibilities of intelligent eyewear. Every curve and carefully shaped detail contributes to a product concept that feels purposeful, understated, and ready to become part of everyday life.',
    position: 'bottom-left',
    at: 6.4, // pull-back: the whole frame becomes recognisable
  },
  {
    id: 'see-more',
    heading: 'Designed to see more.',
    body: 'A closer look reveals the balance between form and function. The frame, temple arm, illuminated details, and overall silhouette come together in a design that explores what happens when intelligent technology meets the simplicity of everyday eyewear. This is ORBIT: a vision of technology shaped around the way we see and experience the world.',
    position: 'bottom-right',
    at: 8.0, // full side profile, final composition
  },
]

// Landscape only: where the footage sits on screen, so the text corners stay
// clear of the product. During the macro shot it sits low (top corners free);
// through the pull-back it rises and eases back (bottom corners free), ending
// on a smaller, centred product, which is the hand-off point for the next section.
// `y` is a share of the viewport height; framing is linear between keys.
export const REVEAL_FRAMING = [
  { at: 0, y: 0.24, scale: 1 },
  { at: 5.0, y: 0.24, scale: 1 },
  { at: 7.0, y: -0.2, scale: 0.75 },
]
