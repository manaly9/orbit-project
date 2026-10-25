// Section 3 (model interaction) copy, positions and timing, all in one place.
// Timing is in seconds of model-interaction footage (orbit_model_interaction.mp4).
// A block shows from its `at` until the next block's `at` (the two crossfade);
// the last one stays up until the section ends.
// `position` maps to a CSS modifier in ModelInteraction.css.

export const INTERACTION_OVERLAYS = [
  {
    id: 'technology-closer',
    label: 'TECHNOLOGY, CLOSER.',
    heading: 'Technology, closer.',
    body: 'A different relationship with technology begins with the way we experience it. ORBIT brings intelligent eyewear into focus through a design made to feel natural, personal, and effortless.',
    position: 'top-left',
    at: 0.4, // opening: glasses held in front of the model
  },
  {
    id: 'feel-natural',
    heading: 'Made to feel natural.',
    body: 'No new habits to learn. No complicated gestures to master. Just a familiar form, thoughtfully reimagined to bring the possibilities of intelligent technology closer to everyday life.',
    position: 'top-right',
    at: 2.8, // model reaches for and handles the frame
  },
  {
    id: 'world-reimagined',
    heading: 'Your world. Reimagined.',
    body: 'Designed to sit naturally within your routine, ORBIT explores a more personal way to experience connected technology. Refined lines, considered details, and an understated silhouette come together in one wearable concept.',
    position: 'bottom-left',
    at: 5.2, // putting on the glasses, frame becomes recognisable on face
  },
  {
    id: 'beyond-ordinary',
    heading: 'See beyond the ordinary.',
    body: 'A new perspective on what eyewear can be. ORBIT brings design and intelligent technology into one considered form, created for a world that never stops moving.',
    position: 'bottom-right',
    at: 7.5, // red illumination activates, final frontal portrait
  },
]
