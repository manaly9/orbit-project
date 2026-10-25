import { useRef } from 'react'
import { gsap, ScrollTrigger, useGSAP } from '../lib/gsap'
import { createSegmentMap, driveTimeline, loadVideoBlob, seekVideo } from '../lib/scrub'
import { INTERACTION_OVERLAYS } from '../data/interactionOverlays'
import { SHOWCASE_CARDS } from '../data/showcaseCards'
import './ProductShowcase.css'

// ── Section 3 video segments (unchanged) ──────────────────────────
const VIDEO_SRC = '/assets/videos/orbit_model_interaction.mp4'
const SEGMENTS = [
  [1.5, 2.0],
  [3.0, 2.5],
  [5.0, 3.0],
  [7.0, 3.0],
  [8.5, 2.5],
  [9.95, 2.0],
]
const { total: VIDEO_UNITS, unitsAt } = createSegmentMap(SEGMENTS)

// ── Card-transition stage lengths ─────────────────────────────────
const SCALE_UNITS = 5      // fullscreen → centred card
const HOLD_UNITS = 1.5     // pause centred (crossfade video → card 1)
const HSCROLL_UNITS = 12   // entire track slides left
const FINAL_HOLD = 1.5     // hold last card

const TOTAL = VIDEO_UNITS + SCALE_UNITS + HOLD_UNITS + HSCROLL_UNITS + FINAL_HOLD
const VH_PER_UNIT = 0.3

// Text fade lengths for the editorial overlays.
const TEXT_IN = 0.6
const SUB_DELAY = 0.12
const TEXT_OUT = 0.5

function stillFor(videoTime) {
  if (videoTime < 2.0) return 0.8
  if (videoTime < 5.0) return 3.0
  if (videoTime < 7.5) return 6.0
  return 8.5
}

export default function ProductShowcase() {
  const sectionRef = useRef(null)
  const videoWrapRef = useRef(null)
  const videoRef = useRef(null)
  const trackRef = useRef(null)

  useGSAP(
    () => {
      const section = sectionRef.current
      const videoWrap = videoWrapRef.current
      const video = videoRef.current
      const track = trackRef.current
      const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      const rise = reduceMotion ? 0 : 14
      const vw = window.innerWidth
      const vh = window.innerHeight

      // ── Card dimensions (all five cards identical) ───────────────
      const cardW = Math.min(1315, vw * 0.85)
      const cardH = Math.round(cardW * (866 / 1315))
      const cardGap = Math.round(Math.max(16, Math.min(30, vw * 0.015)))

      // Scale needed so the card-sized wrapper fills the viewport.
      const videoScale = Math.max(vw / cardW, vh / cardH)

      // Track starts with card 1 centred in the viewport.
      const trackLeft = (vw - cardW) / 2

      // Horizontal distance to scroll through all 5 cards
      // (card 5 ends up centred where card 1 started).
      const totalScrollDist = 4 * (cardW + cardGap)

      // ── Overlay text setup ──────────────────────────────────────
      const blocks = gsap.utils
        .toArray('.interact-overlay', section)
        .map((el) => gsap.utils.toArray(':scope > *', el))
      gsap.set(blocks.flat(), { autoAlpha: 0, y: rise })

      // ── Card elements ───────────────────────────────────────────
      const allCards = gsap.utils.toArray('.showcase__card', track)
      const otherCards = allCards.slice(1) // cards 2-5

      // ── Initial states ──────────────────────────────────────────
      // Video wrapper: card-sized but scaled to fill the viewport.
      gsap.set(videoWrap, {
        width: cardW,
        height: cardH,
        top: '50%',
        left: '50%',
        xPercent: -50,
        yPercent: -50,
        scale: videoScale,
        borderRadius: 0,
        transformOrigin: 'center center',
      })

      // Track: flex row positioned so card 1 is centred.
      track.style.setProperty('--card-gap', cardGap + 'px')
      gsap.set(track, { left: trackLeft, top: '50%', yPercent: -50, x: 0 })

      // All cards: identical size.
      gsap.set(allCards, { width: cardW, height: cardH, borderRadius: 24 })

      // Cards 2-5 hidden until horizontal scroll begins.
      gsap.set(otherCards, { visibility: 'hidden' })

      // ── Build unified timeline ──────────────────────────────────
      const playhead = { video: 0 }
      const tl = gsap.timeline({ paused: true, defaults: { ease: 'none' } })

      // ─ PART A: Video scrub (0 → VIDEO_UNITS ≈ 15) ─
      let at = 0
      for (const [to, units] of SEGMENTS) {
        tl.to(playhead, { video: to, duration: units }, at)
        at += units
      }

      // Editorial text overlays.
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
          tl.fromTo(
            parts,
            { autoAlpha: 1, y: 0 },
            { autoAlpha: 0, y: -rise / 2, duration: TEXT_OUT, ease: 'power1.in', immediateRender: false },
            unitsAt(next.at),
          )
        }
      })

      // Fade out last overlay before the scale stage.
      const lastBlock = blocks[blocks.length - 1]
      if (lastBlock) {
        tl.to(lastBlock, { autoAlpha: 0, duration: 0.8, ease: 'power1.in' }, VIDEO_UNITS - 0.8)
      }

      // ─ PART B – Stage 1: Video scales to centred card ─
      const scaleStart = VIDEO_UNITS

      // Fade the shade overlay.
      const shade = videoWrap.querySelector('.interact__shade')
      if (shade) {
        tl.to(shade, { autoAlpha: 0, duration: SCALE_UNITS * 0.6 }, scaleStart)
      }

      // Scale the wrapper from fullscreen down to its natural card size.
      tl.to(videoWrap, {
        scale: 1,
        borderRadius: 24,
        duration: SCALE_UNITS,
        ease: 'power2.inOut',
      }, scaleStart)

      // ─ PART B – Stage 2: Hold centred + crossfade ─
      // The video wrapper fades out, revealing card 1 behind it at the
      // exact same position and size. This happens over the hold period
      // so no movement occurs during the swap.
      const holdStart = scaleStart + SCALE_UNITS
      tl.to(videoWrap, {
        autoAlpha: 0,
        duration: HOLD_UNITS,
        ease: 'power1.in',
      }, holdStart)

      // ─ PART B – Stage 3: Horizontal scroll ─
      const scrollStart = holdStart + HOLD_UNITS

      // Reveal cards 2-5 (they are off-screen right, so no visual pop).
      tl.set(otherCards, { visibility: 'visible' }, scrollStart)

      // Translate the entire track left.
      tl.to(track, {
        x: -totalScrollDist,
        duration: HSCROLL_UNITS,
        ease: 'none', // linear for even scroll speed
      }, scrollStart)

      // ─ PART B – Stage 4: Final hold ─
      tl.set({}, {}, TOTAL) // ensure exact length
      tl.time(0)

      // ── ScrollTrigger ───────────────────────────────────────────
      const st = ScrollTrigger.create({
        trigger: section,
        start: 'top top',
        end: () => `+=${Math.round(vh * VH_PER_UNIT * TOTAL)}`,
        pin: true,
        anticipatePin: 1,
        invalidateOnRefresh: true,
      })

      const stopDriving = driveTimeline({
        st,
        tl,
        total: TOTAL,
        reduceMotion,
        onUpdate: () =>
          seekVideo(video, reduceMotion ? stillFor(playhead.video) : playhead.video),
      })

      // Lazy-load the video when about one screen away.
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

  return (
    <section
      ref={sectionRef}
      id="experience"
      className="showcase-section"
      aria-label="ORBIT experience and features"
    >
      {/* Video wrapper: starts fullscreen (scaled up), shrinks to centred card */}
      <div ref={videoWrapRef} className="showcase__video-wrap">
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

      {/* Editorial text overlays (Section 3) */}
      <div className="interact__overlays">
        {INTERACTION_OVERLAYS.map((overlay) => (
          <div
            key={overlay.id}
            className={`interact-overlay interact-overlay--${overlay.position}`}
          >
            {overlay.label && (
              <p className="interact-overlay__label">{overlay.label}</p>
            )}
            <h2 className="interact-overlay__heading">{overlay.heading}</h2>
            <p className="interact-overlay__body">{overlay.body}</p>
          </div>
        ))}
      </div>

      {/* Card track: 5 identical cards in a horizontal flex row */}
      <div ref={trackRef} className="showcase__track">
        {SHOWCASE_CARDS.map((card) => (
          <article key={card.id} className="showcase__card">
            {card.video ? (
              <video
                className="showcase__card-vid"
                src={card.video}
                poster={card.poster}
                muted
                loop
                playsInline
                autoPlay
                disablePictureInPicture
                aria-hidden="true"
                tabIndex={-1}
              />
            ) : (
              <img
                src={card.image}
                alt=""
                loading="lazy"
                draggable="false"
              />
            )}
            <div className="showcase__card-body">
              <span className="showcase__card-label">{card.label}</span>
              <h3 className="showcase__card-heading">{card.heading}</h3>
              <p className="showcase__card-desc">{card.body}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
