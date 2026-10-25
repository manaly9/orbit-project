import { useRef } from 'react'
import { gsap, ScrollTrigger, useGSAP } from '../lib/gsap'
import { createSegmentMap, driveTimeline, loadVideoBlob, seekVideo } from '../lib/scrub'
import { REVEAL_FRAMING, REVEAL_OVERLAYS } from '../data/revealOverlays'
import './ProductReveal.css'

// Scrub-optimised copy of orbit_closeup.mp4 (keyframe every 4 frames, no audio).
const VIDEO_SRC = '/assets/videos/orbit_closeup_scrub.mp4'
const POSTER_SRC = '/assets/images/orbit_closeup_poster.jpg'

// Scroll drives the footage from frame 0. Each segment is
// [video time to reach, timeline units spent getting there].
const SEGMENTS = [
  [3.5, 4.0], // macro shot of the red pixel display
  [4.2, 1.6], // display switches to the printed mark, camera opens up
  [5.0, 1.8], // brushed metal and ORBIT branding
  [7.0, 3.2], // pull-back: the frame becomes recognisable
  [8.5, 2.6], // full side profile settles
  [9.95, 2.6], // final composition holds before the next section
]
const { total: SCROLL_UNITS, unitsAt } = createSegmentMap(SEGMENTS)

// Scroll distance per timeline unit, as a fraction of the viewport height.
const VH_PER_UNIT = 0.3

// Text fade lengths, in timeline units.
const TEXT_IN = 0.6
const SUB_DELAY = 0.12
const TEXT_OUT = 0.5

// Reduced motion: hold one representative frame per stage instead of scrubbing.
function stillFor(videoTime) {
  if (videoTime < 3.6) return 1.5
  if (videoTime < 6.4) return 4.5
  if (videoTime < 8.0) return 7.0
  return 9.5
}

export default function ProductReveal() {
  const sectionRef = useRef(null)
  const stageRef = useRef(null)
  const videoRef = useRef(null)

  useGSAP(
    () => {
      const section = sectionRef.current
      const stage = stageRef.current
      const video = videoRef.current
      const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      const rise = reduceMotion ? 0 : 14

      const blocks = gsap.utils
        .toArray('.reveal-overlay', section)
        .map((el) => gsap.utils.toArray(':scope > *', el))
      gsap.set(blocks.flat(), { autoAlpha: 0, y: rise })

      // Same single-timeline model as the hero: footage position, framing and
      // text all live on one paused timeline driven by scroll.
      const playhead = { video: 0 }
      const tl = gsap.timeline({ paused: true, defaults: { ease: 'none' } })
      let at = 0
      for (const [to, units] of SEGMENTS) {
        tl.to(playhead, { video: to, duration: units }, at)
        at += units
      }

      // Framing is applied through CSS variables, which only landscape
      // layouts use (see ProductReveal.css).
      gsap.set(stage, { '--frame-y': REVEAL_FRAMING[0].y, '--frame-scale': REVEAL_FRAMING[0].scale })
      REVEAL_FRAMING.slice(1).forEach((key, i) => {
        const from = unitsAt(REVEAL_FRAMING[i].at)
        const to = unitsAt(key.at)
        if (to > from) {
          tl.to(stage, { '--frame-y': key.y, '--frame-scale': key.scale, duration: to - from, ease: 'sine.inOut' }, from)
        }
      })

      blocks.forEach((parts, i) => {
        const enter = unitsAt(REVEAL_OVERLAYS[i].at)
        const next = REVEAL_OVERLAYS[i + 1]
        parts.forEach((el, j) => {
          tl.fromTo(
            el,
            { autoAlpha: 0, y: rise },
            { autoAlpha: 1, y: 0, duration: TEXT_IN, ease: 'power2.out', immediateRender: false },
            enter + j * SUB_DELAY,
          )
        })
        if (next) {
          // Leaves as the next block arrives.
          tl.fromTo(
            parts,
            { autoAlpha: 1, y: 0 },
            { autoAlpha: 0, y: -rise / 2, duration: TEXT_OUT, ease: 'power1.in', immediateRender: false },
            unitsAt(next.at),
          )
        }
      })
      tl.time(0)

      const st = ScrollTrigger.create({
        trigger: section,
        start: 'top top',
        end: () => `+=${Math.round(window.innerHeight * VH_PER_UNIT * SCROLL_UNITS)}`,
        pin: true,
        anticipatePin: 1,
        invalidateOnRefresh: true,
      })

      const stopDriving = driveTimeline({
        st,
        tl,
        total: SCROLL_UNITS,
        reduceMotion,
        onUpdate: () => seekVideo(video, reduceMotion ? stillFor(playhead.video) : playhead.video),
      })

      // Fetch the footage once the section is about a screen away, so it does
      // not compete with the hero video on first load. The poster (frame 0)
      // covers the stage until then.
      let stopLoading = null
      const preload = ScrollTrigger.create({
        trigger: section,
        start: 'top bottom+=100%',
        once: true,
        onEnter: () => {
          stopLoading = loadVideoBlob(video, VIDEO_SRC)
        },
      })

      return () => {
        stopDriving()
        preload.kill()
        stopLoading?.()
      }
    },
    { scope: sectionRef },
  )

  // The pinned stage ends on the scaled-down side profile: the hand-off point
  // for the upcoming product showcase.
  return (
    <section ref={sectionRef} id="reveal" className="reveal" aria-label="ORBIT product reveal">
      <div ref={stageRef} className="reveal__stage">
        <video
          ref={videoRef}
          className="reveal__video"
          poster={POSTER_SRC}
          muted
          playsInline
          preload="none"
          disablePictureInPicture
          aria-hidden="true"
          tabIndex={-1}
        />
      </div>

      <div className="reveal__overlays">
        {REVEAL_OVERLAYS.map((overlay) => (
          <div key={overlay.id} className={`reveal-overlay reveal-overlay--${overlay.position}`}>
            {overlay.label && <p className="reveal-overlay__label">{overlay.label}</p>}
            <h2 className="reveal-overlay__heading">{overlay.heading}</h2>
            <p className="reveal-overlay__body">{overlay.body}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
