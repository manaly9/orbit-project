import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { gsap } from '../lib/gsap'
import './LoadingReveal.css'

function getTileOrder(width, height, tileSize) {
  const columns = Math.ceil(width / tileSize)
  const rows = Math.ceil(height / tileSize)
  const centerX = width / 2
  const centerY = height / 2
  const tiles = []

  for (let row = 0; row < rows; row += 1) {
    for (let column = 0; column < columns; column += 1) {
      const x = column * tileSize
      const y = row * tileSize
      const dx = x + Math.min(tileSize, width - x) / 2 - centerX
      const dy = y + Math.min(tileSize, height - y) / 2 - centerY
      const noise = ((column * 37 + row * 61 + column * row * 13) % 17) / 17

      tiles.push({
        x,
        y,
        width: Math.min(tileSize, width - x),
        height: Math.min(tileSize, height - y),
        distance: Math.hypot(dx, dy) + noise * tileSize * 0.45,
      })
    }
  }

  tiles.sort((a, b) => a.distance - b.distance)
  return tiles
}

export default function LoadingReveal({ heroReady, onComplete }) {
  const screenRef = useRef(null)
  const canvasRef = useRef(null)
  const counterRef = useRef(null)
  const onCompleteRef = useRef(onComplete)
  const [reduceMotion] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches)
  const [percent, setPercent] = useState(reduceMotion ? 100 : 10)
  const [counterFinished, setCounterFinished] = useState(false)
  const isRevealing = counterFinished && heroReady

  useLayoutEffect(() => {
    const updateViewport = () => {
      screenRef.current.style.width = `${window.innerWidth}px`
      screenRef.current.style.height = `${window.innerHeight}px`
    }

    updateViewport()
    window.addEventListener('resize', updateViewport)
    return () => window.removeEventListener('resize', updateViewport)
  }, [])

  useEffect(() => {
    onCompleteRef.current = onComplete
  }, [onComplete])

  useEffect(() => {
    const progress = { value: reduceMotion ? 100 : 10 }
    const timeline = gsap.timeline({
      onComplete: () => setCounterFinished(true),
    })

    if (reduceMotion) {
      timeline.to(progress, { value: 100, duration: 0.2 })
    } else {
      timeline.to(progress, {
        value: 100,
        duration: 1.55,
        ease: 'power2.out',
        onUpdate: () => setPercent(Math.round(progress.value)),
      })
    }

    timeline.to({}, { duration: reduceMotion ? 0.15 : 0.35 })

    return () => timeline.kill()
  }, [reduceMotion])

  useEffect(() => {
    if (!isRevealing) return undefined

    const screen = screenRef.current
    const canvas = canvasRef.current
    const context = canvas.getContext('2d')
    const progress = { value: 0 }
    const tileSize = reduceMotion ? 22 : window.innerWidth < 600 ? 12 : 15
    const canvasScale = Math.min(window.devicePixelRatio || 1, 2)
    let width = 0
    let height = 0
    let tiles = []
    let clearedCount = 0

    const paint = (progressValue, reset = false) => {
      if (reset) {
        context.fillStyle = '#050505'
        context.fillRect(0, 0, width, height)
        clearedCount = 0
      }
      const revealed = Math.floor(progressValue * tiles.length)
      while (clearedCount < revealed) {
        const tile = tiles[clearedCount]
        context.clearRect(tile.x, tile.y, tile.width + 0.5, tile.height + 0.5)
        clearedCount += 1
      }
    }

    const resize = () => {
      const bounds = screen.getBoundingClientRect()
      width = bounds.width
      height = bounds.height
      canvas.width = Math.round(width * canvasScale)
      canvas.height = Math.round(height * canvasScale)
      context.setTransform(canvasScale, 0, 0, canvasScale, 0, 0)
      tiles = getTileOrder(width, height, tileSize)
      paint(progress.value, true)
    }

    resize()
    window.addEventListener('resize', resize)

    const timeline = gsap.timeline({
      onComplete: () => onCompleteRef.current?.(),
    })

    timeline
      .to(counterRef.current, { autoAlpha: 0, duration: reduceMotion ? 0.12 : 0.2, ease: 'power1.out' }, 0)
      .to(
        progress,
        {
          value: 1,
          duration: reduceMotion ? 0.38 : 1.8,
          ease: 'power1.inOut',
          onUpdate: () => paint(progress.value),
        },
        0,
      )

    return () => {
      window.removeEventListener('resize', resize)
      timeline.kill()
    }
  }, [isRevealing, reduceMotion])

  return (
    <div
      ref={screenRef}
      className={`loading-screen${isRevealing ? ' loading-screen--revealing' : ''}`}
      role="status"
      aria-label="Loading ORBIT experience"
    >
      <svg className="loading-screen__waves" viewBox="0 0 1440 900" preserveAspectRatio="none" aria-hidden="true">
        <g className="loading-screen__wave-group">
          <path d="M-100 250 C140 130 250 370 490 250 S840 130 1080 250 S1430 370 1670 250" />
          <path d="M-100 430 C140 310 250 550 490 430 S840 310 1080 430 S1430 550 1670 430" />
          <path d="M-100 610 C140 490 250 730 490 610 S840 490 1080 610 S1430 730 1670 610" />
        </g>
        <g className="loading-screen__wave-group loading-screen__wave-group--slow">
          <path d="M-100 340 C160 470 310 210 570 340 S980 470 1240 340 S1570 210 1830 340" />
          <path d="M-100 700 C160 830 310 570 570 700 S980 830 1240 700 S1570 570 1830 700" />
        </g>
      </svg>

      <canvas ref={canvasRef} className="loading-screen__tiles" aria-hidden="true" />
      <span
        ref={counterRef}
        className="loading-screen__counter"
        role="progressbar"
        aria-label="Loading progress"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
      >
        {percent}%
      </span>
    </div>
  )
}
