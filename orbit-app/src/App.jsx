import { useRef } from 'react'
import Nav from './components/Nav.jsx'
import Hero from './components/Hero.jsx'

function App() {
  const navRef = useRef(null)

  return (
    <>
      <Nav ref={navRef} />
      <main>
        <Hero navRef={navRef} />
      </main>
    </>
  )
}

export default App
