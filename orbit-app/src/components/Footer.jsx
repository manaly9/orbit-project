import { useEffect, useRef } from 'react'
import { gsap, useGSAP } from '../lib/gsap'
import './Footer.css'

const VIDEO_SRC = '/assets/videos/orbit_footer_loop.mp4'
const POSTER_SRC = '/assets/images/orbit_footer_poster.jpg'
const COPYRIGHT_YEAR = new Date().getFullYear()

export default function Footer() {
  const footerRef = useRef(null)
  const videoRef = useRef(null)

  useEffect(() => {
    const video = videoRef.current
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
    let inView = false

    function syncPlayback() {
      if (!inView || document.hidden || reducedMotion.matches) {
        video.pause()
        return
      }

      if (!video.hasAttribute('src')) video.src = VIDEO_SRC
      video.play().catch(() => {
        // The poster remains visible if autoplay or video decoding fails.
      })
    }

    const observer = new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting
      syncPlayback()
    })
    observer.observe(footerRef.current)
    reducedMotion.addEventListener('change', syncPlayback)
    document.addEventListener('visibilitychange', syncPlayback)

    return () => {
      observer.disconnect()
      reducedMotion.removeEventListener('change', syncPlayback)
      document.removeEventListener('visibilitychange', syncPlayback)
      video.pause()
    }
  }, [])

  useGSAP(() => {
    const media = gsap.matchMedia()
    media.add('(prefers-reduced-motion: no-preference)', () => {
      const footer = footerRef.current
      const upper = footer.querySelector('.orbit-footer__editorial')
      const panel = footer.querySelector('.orbit-footer__panel')
      const intro = gsap.timeline({ paused: true, defaults: { ease: 'power2.out' } })
        .from(upper.querySelector('h2'), { opacity: 0, y: 16, duration: 0.65 })
        .from(upper.querySelectorAll('.orbit-footer__intro-item'), {
          opacity: 0, y: 8, duration: 0.45, stagger: 0.09,
        }, 0.15)
      const glass = gsap.timeline({ paused: true, defaults: { ease: 'power2.out' } })
        .from(panel, { opacity: 0, y: 18, duration: 0.62 })
        .from(panel.querySelectorAll('.orbit-footer__reveal'), {
          opacity: 0, y: 8, duration: 0.45, stagger: 0.08,
        }, 0.22)
        .from(panel.querySelector('.orbit-footer__wordmark'), { opacity: 0, duration: 0.65 }, 0.36)

      const reveals = new Map([[upper, intro], [panel, glass]])
      const observer = new IntersectionObserver((entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue
          reveals.get(entry.target).play()
          observer.unobserve(entry.target)
        }
      }, { threshold: 0.12 })
      observer.observe(upper)
      observer.observe(panel)

      function showOnFocus(event) {
        const section = panel.contains(event.target) ? panel : upper
        reveals.get(section).progress(1).pause()
        observer.unobserve(section)
      }
      footer.addEventListener('focusin', showOnFocus)

      return () => {
        observer.disconnect()
        footer.removeEventListener('focusin', showOnFocus)
      }
    })
    return () => media.revert()
  }, { scope: footerRef })

  return (
    <footer ref={footerRef} id="footer" className="orbit-footer">
      <video
        ref={videoRef}
        className="orbit-footer__video"
        poster={POSTER_SRC}
        preload="none"
        muted
        loop
        playsInline
        disablePictureInPicture
        aria-hidden="true"
        tabIndex={-1}
      />
      <div className="orbit-footer__shade" aria-hidden="true" />
      <div className="orbit-footer__editorial">
        <div>
          <p className="orbit-footer__eyebrow">ORBIT / INTELLIGENT EYEWEAR</p>
          <h2>The future,<br />in your view.</h2>
        </div>
        <div className="orbit-footer__intro">
          <p className="orbit-footer__intro-item">
            Intelligence in sight. A new perspective on the world around you.
            Thoughtfully designed to bring technology and everyday life together.
          </p>
          <a className="orbit-footer__discover orbit-footer__intro-item" href="#experience">
            Discover ORBIT <span aria-hidden="true">↗</span>
          </a>
        </div>
      </div>
      <div className="orbit-footer__panel">
        <div className="orbit-footer__wordmark" aria-hidden="true">ORBIT</div>
        <div className="orbit-footer__columns">
          <div className="orbit-footer__reveal">
            <h3 className="orbit-footer__eyebrow">Stay in Orbit</h3>
            <p>Be among the first to experience a new perspective.</p>
            <details id="early-access" className="orbit-footer__access">
              <summary className="orbit-footer__cta">
                Early Access <span aria-hidden="true">+</span>
              </summary>
              <p>Early Access registration isn’t available yet.</p>
            </details>
          </div>
          <nav className="orbit-footer__links orbit-footer__reveal" aria-label="Explore">
            <h3 className="orbit-footer__eyebrow">Explore</h3>
            <a href="#reveal">Technology</a>
            <a href="#experience">Design</a>
            <a href="#top">Discover</a>
          </nav>
          <div className="orbit-footer__links orbit-footer__reveal">
            <h3 className="orbit-footer__eyebrow">Connect</h3>
            <a href="#experience">Discover ORBIT <span aria-hidden="true">↗</span></a>
          </div>
        </div>
        <p className="orbit-footer__copyright orbit-footer__reveal">
          © {COPYRIGHT_YEAR} ORBIT
        </p>
      </div>
    </footer>
  )
}
