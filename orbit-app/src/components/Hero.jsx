import { useRef } from 'react'
import { gsap, ScrollTrigger, useGSAP } from '../lib/gsap'
import { createSegmentMap, driveTimeline, loadVideoBlob, seekVideo } from '../lib/scrub'
import { HERO_OPENING, HERO_OVERLAYS } from '../data/heroOverlays'
import './Hero.css'

// Scrub-optimised copy of orbit_hero.mp4 (keyframe every 4 frames, no audio).
const VIDEO_SRC = '/assets/videos/orbit_hero_scrub.mp4'
const POSTER_SRC = '/assets/images/orbit_hero_poster.jpg'

// Scroll drives the footage from frame 0. Each segment is
// [video time to reach, timeline units spent getting there]. Slow or
// near-static stretches get more units so their text has room to be read.
const SEGMENTS = [
  [0.9, 2.0], // opening composition clears, three-quarter view
  [2.0, 3.0], // camera drift before the head turn
  [3.0, 2.4], // head turns to the camera
  [4.35, 3.2], // forward-facing hold
  [4.95, 1.2], // model dissolves into the product shot
  [7.35, 3.2], // product rotation
  [8.9, 2.8], // built-in gold circuit glow
  [9.95, 2.4], // final front view
]
const { total: SCROLL_UNITS, unitsAt } = createSegmentMap(SEGMENTS)

// Scroll distance per timeline unit, as a fraction of the viewport height.
const VH_PER_UNIT = 0.3

// Text fade lengths, in timeline units.
const TEXT_IN = 0.6
const SUB_DELAY = 0.12
const TEXT_OUT = 0.5

// Reduced motion: hold one representative frame per scene instead of scrubbing.
function stillFor(videoTime) {
  if (videoTime < 2.0) return 0
  if (videoTime < 4.4) return 3.4
  if (videoTime < 7.4) return 6.0
  if (videoTime < 9.0) return 8.2
  return 9.6
}

export default function Hero() {
  const sectionRef = useRef(null)
  const videoRef = useRef(null)

  useGSAP(
    () => {
      const section = sectionRef.current
      const video = videoRef.current
      const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      const rise = reduceMotion ? 0 : 14

      const opening = gsap.utils.toArray('.hero-opening > *', section)
      const blocks = gsap.utils
        .toArray('.hero-overlay', section)
        .map((el) => [el.querySelector('.hero-overlay__heading'), el.querySelector('.hero-overlay__body')])
      gsap.set(blocks.flat(), { autoAlpha: 0, y: rise })

      // One timeline holds the footage position and every piece of text, so
      // text can never drift from the frame it belongs to, in either direction.
      // At time 0 it is the opening composition: frame 0, wordmark up, side
      // text hidden.
      const playhead = { video: 0 }
      const tl = gsap.timeline({ paused: true, defaults: { ease: 'none' } })
      let at = 0
      for (const [to, units] of SEGMENTS) {
        tl.to(playhead, { video: to, duration: units }, at)
        at += units
      }

      tl.fromTo(
        opening,
        { autoAlpha: 1, y: 0 },
        { autoAlpha: 0, y: -rise, duration: 0.9, ease: 'power1.in', stagger: 0.06, immediateRender: false },
        unitsAt(HERO_OPENING.exitAt),
      )

      blocks.forEach(([heading, body], i) => {
        const enter = unitsAt(HERO_OVERLAYS[i].at)
        const next = HERO_OVERLAYS[i + 1]
        const reveal = { autoAlpha: 1, y: 0, duration: TEXT_IN, ease: 'power2.out', immediateRender: false }
        tl.fromTo(heading, { autoAlpha: 0, y: rise }, { ...reveal }, enter)
        tl.fromTo(body, { autoAlpha: 0, y: rise }, { ...reveal }, enter + SUB_DELAY)
        if (next) {
          // Leaves as the next block arrives.
          tl.fromTo(
            [heading, body],
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
      const stopLoading = loadVideoBlob(video, VIDEO_SRC)

      let alive = true
      document.fonts?.ready.then(() => alive && ScrollTrigger.refresh())

      return () => {
        alive = false
        stopDriving()
        stopLoading()
      }
    },
    { scope: sectionRef },
  )

  return (
    <section ref={sectionRef} id="top" className="hero" aria-label="ORBIT introduction">
      <div className="hero__stage">
        <video
          ref={videoRef}
          className="hero__video"
          poster={POSTER_SRC}
          muted
          playsInline
          preload="auto"
          disablePictureInPicture
          aria-hidden="true"
          tabIndex={-1}
        />
        <div className="hero__shade" aria-hidden="true" />
      </div>

      <div className="hero-opening">
        <div className="hero-opening__main">
          <p className="hero-opening__label">{HERO_OPENING.label}</p>
          <h1 className="hero-opening__wordmark">{HERO_OPENING.wordmark}</h1>
          <p className="hero-opening__lead">
            {HERO_OPENING.lead.map((line) => (
              <span key={line}>{line}</span>
            ))}
          </p>
        </div>
        <p className="hero-opening__aside">
          {HERO_OPENING.aside.map((line) => (
            <span key={line}>{line}</span>
          ))}
        </p>
      </div>

      <div className="hero__overlays">
        {HERO_OVERLAYS.map((overlay) => (
          <div key={overlay.id} className={`hero-overlay hero-overlay--${overlay.position}`}>
            <h3 className="hero-overlay__heading">{overlay.heading}</h3>
            <p className="hero-overlay__body">{overlay.body}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
