import { gsap } from './gsap'

// Shared machinery for the scroll-scrubbed video sections.

const FRAME = 1 / 24

// Scroll smoothing: exponential approach rate (per second).
const EASE_RATE = 7

// `segments` is a list of [video time to reach, timeline units spent getting
// there]. Returns the total units and a lookup from video time to timeline
// position, so text can be timed in seconds of footage.
export function createSegmentMap(segments) {
  const total = segments.reduce((sum, [, units]) => sum + units, 0)
  const unitsAt = (videoTime) => {
    let fromVideo = 0
    let fromUnits = 0
    for (const [toVideo, units] of segments) {
      if (videoTime <= toVideo) return fromUnits + ((videoTime - fromVideo) / (toVideo - fromVideo)) * units
      fromVideo = toVideo
      fromUnits += units
    }
    return fromUnits
  }
  return { total, unitsAt }
}

export function seekVideo(video, t) {
  if (video.readyState < 1 || video.seeking) return
  const clamped = Math.min(Math.max(t, 0), video.duration - FRAME / 2)
  if (Math.abs(video.currentTime - clamped) >= FRAME / 2) video.currentTime = clamped
}

// Eases a paused timeline toward the scroll position of `st` every frame and
// calls `onUpdate` after each step. The footage never plays on its own.
// Returns a cleanup function.
export function driveTimeline({ st, tl, total, reduceMotion, onUpdate }) {
  let current = null
  const tick = (_time, deltaMs) => {
    const target = st.progress * total
    if (current === null || reduceMotion) {
      // First frame (including a refresh mid-page): jump straight there.
      current = target
    } else {
      const dt = Math.min(deltaMs, 100) / 1000
      const diff = target - current
      current = Math.abs(diff) < 0.0005 ? target : current + diff * (1 - Math.exp(-dt * EASE_RATE))
    }
    tl.time(current)
    onUpdate()
  }
  gsap.ticker.add(tick)
  return () => gsap.ticker.remove(tick)
}

// Loads the whole file up front so scrubbing never waits on the network; the
// poster covers the stage until it is ready. Returns a cleanup function.
export function loadVideoBlob(video, src) {
  let blobUrl = null
  const controller = new AbortController()
  fetch(src, { signal: controller.signal })
    .then((res) => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      return res.blob()
    })
    .then((blob) => {
      blobUrl = URL.createObjectURL(blob)
      video.src = blobUrl
    })
    .catch((err) => {
      if (err.name !== 'AbortError') video.src = src
    })
  return () => {
    controller.abort()
    video.removeAttribute('src')
    video.load()
    if (blobUrl) URL.revokeObjectURL(blobUrl)
  }
}
