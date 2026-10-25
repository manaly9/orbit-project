import { useRef } from 'react'
import { gsap, ScrollTrigger, useGSAP } from '../lib/gsap'
import { createSegmentMap, driveTimeline, loadVideoBlob, seekVideo } from '../lib/scrub'
import { INTERACTION_OVERLAYS } from '../data/interactionOverlays'
import './ModelInteraction.css'

// Uses the original footage (no _scrub variant available). The blob-loading
// approach ensures the full file is cached in memory, and modern browsers
// handle inter-keyframe seeking well for short clips. If scrubbing feels
// choppy, re-encode with frequent keyframes:
//   ffmpeg -i orbit_model_interaction.mp4 -g 4 -an orbit_model_interaction_scrub.mp4
const VIDEO_SRC = '/assets/videos/orbit_model_interaction.mp4'

// Scroll drives the footage from frame 0. Each segment is
// [video time to reach, timeline units spent getting there].
// Slower or near-static stretches get more units so text has room to be read.
const SEGMENTS = [
  [1.5, 2.0], // opening composition: glasses held before the model
  [3.0, 2.5], // model reaches for the frame, begins handling
  [5.0, 3.0], // turning, lifting toward the face
  [7.0, 3.0], // putting on, glasses settling on the face
  [8.5, 2.5], // red illumination activates
  [9.95, 2.0], // final frontal portrait holds
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
  if (videoTime < 2.0) return 0.8
  if (videoTime < 5.0) return 3.0
  if (videoTime < 7.5) return 6.0
  return 8.5
}

export default function ModelInteraction() {
  const sectionRef = useRef(null)
  const videoRef = useRef(null)

  useGSAP(
    () => {
      const section = sectionRef.current
      const video = videoRef.current
      const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      const rise = reduceMotion ? 0 : 14

      const blocks = gsap.utils
        .toArray('.interact-overlay', section)
        .map((el) => gsap.utils.toArray(':scope > *', el))
      gsap.set(blocks.flat(), { autoAlpha: 0, y: rise })

      // Same single-timeline model as sections 1 and 2: footage position and
      // text all live on one paused timeline driven by scroll.
      const playhead = { video: 0 }
      const tl = gsap.timeline({ paused: true, defaults: { ease: 'none' } })
      let at = 0
      for (const [to, units] of SEGMENTS) {
        tl.to(playhead, { video: to, duration: units }, at)
        at += units
      }

      blocks.forEach((parts, i) => {
        const enter = unitsAt(INTERACTION_OVERLAYS[i].at)
        const next = INTERACTION_OVERLAYS[i + 1]
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
      // not compete with earlier videos on first load.
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

  // The final frame is a frontal portrait with the glasses on and the red
  // illumination visible. The section ends holding this composition so a
  // future product-showcase section can transition from it smoothly.
  return (
    <section ref={sectionRef} id="experience" className="interact" aria-label="ORBIT model interaction">
      <div className="interact__stage">
        <video
          ref={videoRef}
          className="interact__video"
          muted
          playsInline
          preload="none"
          disablePictureInPicture
          aria-hidden="true"
          tabIndex={-1}
        />
        <div className="interact__shade" aria-hidden="true" />
      </div>

      <div className="interact__overlays">
        {INTERACTION_OVERLAYS.map((overlay) => (
          <div key={overlay.id} className={`interact-overlay interact-overlay--${overlay.position}`}>
            {overlay.label && <p className="interact-overlay__label">{overlay.label}</p>}
            <h2 className="interact-overlay__heading">{overlay.heading}</h2>
            <p className="interact-overlay__body">{overlay.body}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
