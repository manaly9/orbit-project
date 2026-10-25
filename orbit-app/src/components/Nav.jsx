import './Nav.css'

export default function Nav() {
  return (
    <header className="nav">
      <a className="nav__brand" href="#top" aria-label="ORBIT home">
        ORBIT
      </a>

      <nav className="nav__links" aria-label="Primary">
        <a href="#technology">Technology</a>
        <a href="#design">Design</a>
        <a href="#discover">Discover</a>
      </nav>

      <a className="nav__cta" href="#early-access">
        Early Access
        <span className="nav__cta-icon" aria-hidden="true">
          <svg viewBox="0 0 16 16" width="10" height="10">
            <path d="M3 8h10M9.5 4.5 13 8l-3.5 3.5" fill="none" stroke="currentColor" strokeWidth="1.6" />
          </svg>
        </span>
      </a>
    </header>
  )
}
