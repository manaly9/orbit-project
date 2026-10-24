import { useRef } from 'react'
import { gsap, ScrollTrigger, useGSAP } from '../lib/gsap'
import { HERO_OPENING, HERO_OVERLAYS } from '../data/heroOverlays'
import './Hero.css'

// Scrub-optimised copy of orbit_hero.mp4 (keyframe every 4 frames, no audio).
const VIDEO_SRC = '/assets/videos/orbit_hero_scrub.mp4'
const POSTER_SRC = '/assets/images/orbit_hero_poster.jpg'

const FRAME = 1 / 24

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
const SCROLL_UNITS = SEGMENTS.reduce((sum, [, units]) => sum + units, 0)

// Scroll distance per timeline unit, as a fraction of the viewport height.
const VH_PER_UNIT = 0.3

// Text fade lengths, in timeline units.
const TEXT_IN = 0.6
const SUB_DELAY = 0.12
const TEXT_OUT = 0.5

// Scroll smoothing: exponential approach rate (per second).
const EASE_RATE = 7

// Timeline position at which the footage reaches `videoTime`.
function unitsAt(videoTime) {
  let fromVideo = 0
  let fromUnits = 0
  for (const [toVideo, units] of SEGMENTS) {
    if (videoTime <= toVideo) return fromUnits + ((videoTime - fromVideo) / (toVideo - fromVideo)) * units
    fromVideo = toVideo
    fromUnits += units
  }
  return fromUnits
}

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

      const seekTo = (t) => {
        if (video.readyState < 1 || video.seeking) return
        const clamped = Math.min(Math.max(t, 0), video.duration - FRAME / 2)
        if (Math.abs(video.currentTime - clamped) >= FRAME / 2) video.currentTime = clamped
      }

      // The footage never plays on its own; every frame comes from scroll.
      let current = null
      const tick = (_time, deltaMs) => {
        const target = st.progress * SCROLL_UNITS
        if (current === null || reduceMotion) {
          // First frame (including a refresh mid-page): jump straight there.
          current = target
        } else {
          const dt = Math.min(deltaMs, 100) / 1000
          const diff = target - current
          current = Math.abs(diff) < 0.0005 ? target : current + diff * (1 - Math.exp(-dt * EASE_RATE))
        }
        tl.time(current)
        seekTo(reduceMotion ? stillFor(playhead.video) : playhead.video)
      }
      gsap.ticker.add(tick)

      // Load the whole file up front so scrubbing never waits on the network.
      // The poster (frame 0) covers the stage until it is ready.
      let blobUrl = null
      const controller = new AbortController()
      fetch(VIDEO_SRC, { signal: controller.signal })
        .then((res) => {
          if (!res.ok) throw new Error(`HTTP ${res.status}`)
          return res.blob()
        })
        .then((blob) => {
          blobUrl = URL.createObjectURL(blob)
          video.src = blobUrl
        })
        .catch((err) => {
          if (err.name !== 'AbortError') video.src = VIDEO_SRC
        })

      let alive = true
      document.fonts?.ready.then(() => alive && ScrollTrigger.refresh())

      return () => {
        alive = false
        gsap.ticker.remove(tick)
        controller.abort()
        video.removeAttribute('src')
        video.load()
        if (blobUrl) URL.revokeObjectURL(blobUrl)
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
