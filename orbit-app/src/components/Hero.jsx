import { useRef } from 'react'
import { gsap, ScrollTrigger, useGSAP } from '../lib/gsap'
import { HERO_OVERLAYS } from '../data/heroOverlays'
import './Hero.css'

// Scrub-optimised copy of orbit_hero.mp4 (keyframe every 4 frames, no audio).
const VIDEO_SRC = '/assets/videos/orbit_hero_scrub.mp4'
const POSTER_SRC = '/assets/images/orbit_hero_poster.jpg'

const FRAME = 1 / 24

// The opening plays by itself up to this video time: the head turn has
// finished and the model is settled, facing the camera.
const INTRO_END = 3.4

// After the intro, scroll drives the footage. Each segment is
// [video time to reach, timeline units spent getting there]. Near-static
// stretches get more units so their overlays have room to be read.
const SEGMENTS = [
  [3.75, 2.0], // forward-facing hold, first half
  [4.15, 2.4], // forward-facing hold, second half
  [4.35, 0.8], // last beat before the dissolve
  [4.95, 1.4], // model dissolves into the product shot
  [7.35, 3.0], // product rotation
  [8.9, 2.4], // built-in gold circuit glow
  [9.95, 1.4], // final front view
]
const SCROLL_UNITS = SEGMENTS.reduce((sum, [, units]) => sum + units, 0)

// Scroll distance per timeline unit, as a fraction of the viewport height.
const VH_PER_UNIT = 0.42

// [enter, exit] per overlay, in timeline units. Intro units are real seconds
// of footage; null exit keeps the overlay up until the hero ends.
const OVERLAY_TIMING = [
  [2.0, 3.5], // see beyond.                    head starts turning (2.0s)
  [2.65, 4.0], // a new perspective.            faces the camera (~2.8s)
  [4.6, 6.2], // built for what's next.         forward hold (~3.6–3.9s)
  [6.8, 8.0], // not just eyewear.              before the dissolve (~4.0–4.35s)
  [10.2, 12.3], // intelligence in every detail. rotation (~5.1–7.3s)
  [13.2, null], // the future, in your view.    gold glow (~7.5s on)
]
const TEXT_IN = 0.6
const SUB_DELAY = 0.15
const TEXT_OUT = 0.6

// Scroll smoothing: exponential approach rate (per second), plus a speed cap
// while still inside the intro footage so an early scroll fast-forwards the
// head turn at no more than 2.5x instead of skipping it.
const EASE_RATE = 7
const INTRO_CATCHUP_RATE = 2.5

// Reduced motion: hold one representative frame per scene instead of scrubbing.
function stillFor(videoTime) {
  if (videoTime < 4.4) return INTRO_END
  if (videoTime < 7.4) return 6.0
  if (videoTime < 9.0) return 8.2
  return 9.6
}

export default function Hero({ navRef }) {
  const sectionRef = useRef(null)
  const videoRef = useRef(null)

  useGSAP(
    () => {
      const section = sectionRef.current
      const video = videoRef.current
      const nav = navRef?.current
      const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      const rise = reduceMotion ? 0 : 18

      const parts = gsap.utils
        .toArray('.hero-overlay', section)
        .map((el) => [el.querySelector('.hero-overlay__heading'), el.querySelector('.hero-overlay__sub')])
      gsap.set(parts.flat(), { autoAlpha: 0, y: rise })
      if (nav) gsap.set(nav, { autoAlpha: 0, y: reduceMotion ? 0 : -14 })

      // One timeline holds both the footage position and every overlay, so
      // text can never drift from the frame it belongs to, in either direction.
      const playhead = { video: 0 }
      const tl = gsap.timeline({ paused: true, defaults: { ease: 'none' } })
      tl.to(playhead, { video: INTRO_END, duration: INTRO_END }, 0)
      let at = INTRO_END
      for (const [to, units] of SEGMENTS) {
        tl.to(playhead, { video: to, duration: units }, at)
        at += units
      }
      parts.forEach(([heading, sub], i) => {
        const [enter, exit] = OVERLAY_TIMING[i]
        const reveal = { autoAlpha: 1, y: 0, duration: TEXT_IN, ease: 'power2.out', immediateRender: false }
        tl.fromTo(heading, { autoAlpha: 0, y: rise }, { ...reveal }, enter)
        tl.fromTo(sub, { autoAlpha: 0, y: rise }, { ...reveal }, enter + SUB_DELAY)
        if (exit != null) {
          tl.fromTo(
            [heading, sub],
            { autoAlpha: 1, y: 0 },
            { autoAlpha: 0, y: -rise / 2, duration: TEXT_OUT, ease: 'power1.in', immediateRender: false },
            exit,
          )
        }
      })

      const st = ScrollTrigger.create({
        trigger: section,
        start: 'top top',
        end: () => `+=${Math.round(window.innerHeight * VH_PER_UNIT * SCROLL_UNITS)}`,
        pin: true,
        anticipatePin: 1,
        invalidateOnRefresh: true,
      })
      const scrollTarget = () => INTRO_END + st.progress * SCROLL_UNITS

      // 'loading' -> 'intro' (footage plays itself) -> 'scroll' (scroll drives it)
      let phase = 'loading'
      let current = 0
      let introClock = null // only used if muted autoplay is refused
      const intro = { t: 0 }

      let navShown = false
      const showNav = () => {
        if (navShown || !nav) return
        navShown = true
        gsap.to(nav, { autoAlpha: 1, y: 0, duration: 1.1, ease: 'power3.out' })
      }
      // Safety net in case the footage is slow to arrive.
      let navTimer = gsap.delayedCall(4.5, showNav)

      const seekTo = (t) => {
        if (video.readyState < 1 || video.seeking) return
        const clamped = Math.min(Math.max(t, 0), video.duration - FRAME / 2)
        if (Math.abs(video.currentTime - clamped) >= FRAME / 2) video.currentTime = clamped
      }

      const startScrollPhase = () => {
        if (phase === 'scroll') return
        if (phase === 'loading' || reduceMotion) current = scrollTarget()
        else current = introClock ? intro.t : Math.min(video.currentTime, INTRO_END)
        phase = 'scroll'
        introClock?.kill()
        video.pause()
        showNav()
      }

      const startIntro = () => {
        if (phase !== 'loading') return
        if (reduceMotion || st.progress > 0) {
          startScrollPhase()
          return
        }
        phase = 'intro'
        navTimer.kill()
        navTimer = gsap.delayedCall(2, showNav)
        video.muted = true
        video.play().catch(() => {
          // Autoplay refused (e.g. power saving): drive the intro by seeking.
          if (phase !== 'intro') return
          introClock = gsap.to(intro, { t: INTRO_END, duration: INTRO_END - intro.t, ease: 'none' })
        })
      }

      const tick = (_time, deltaMs) => {
        if (phase === 'loading') return

        if (phase === 'intro') {
          if (st.progress > 0) {
            // Visitor scrolled early: hand over from the frame on screen.
            startScrollPhase()
          } else {
            if (!introClock) intro.t = Math.min(video.currentTime, INTRO_END)
            if (intro.t >= INTRO_END - FRAME / 2 || video.ended) {
              intro.t = INTRO_END
              startScrollPhase()
            }
            if (phase === 'intro') {
              current = intro.t
              tl.time(current)
              if (introClock) seekTo(playhead.video)
              return
            }
          }
        }

        const target = scrollTarget()
        if (reduceMotion) {
          current = target
        } else {
          const dt = Math.min(deltaMs, 100) / 1000
          const diff = target - current
          let step = diff * (1 - Math.exp(-dt * EASE_RATE))
          if (current < INTRO_END) step = Math.min(step, INTRO_CATCHUP_RATE * dt)
          current = Math.abs(diff) < 0.0005 ? target : current + step
        }
        tl.time(current)
        seekTo(reduceMotion ? stillFor(playhead.video) : playhead.video)
      }
      gsap.ticker.add(tick)

      // Load the whole file up front so scrubbing never waits on the network.
      // The poster (first frame) covers the stage until it is ready.
      let blobUrl = null
      const controller = new AbortController()
      const onLoadedData = () => startIntro()
      const onError = () => startScrollPhase()
      video.addEventListener('loadeddata', onLoadedData)
      video.addEventListener('error', onError)
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
        video.removeEventListener('loadeddata', onLoadedData)
        video.removeEventListener('error', onError)
        video.pause()
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

      <div className="hero__overlays">
        {HERO_OVERLAYS.map((overlay, i) => {
          const Heading = i === 0 ? 'h1' : 'h2'
          return (
            <div key={overlay.id} className={`hero-overlay hero-overlay--${overlay.position}`}>
              <Heading className="hero-overlay__heading">{overlay.heading}</Heading>
              <p className="hero-overlay__sub">{overlay.sub}</p>
            </div>
          )
        })}
      </div>
    </section>
  )
}
