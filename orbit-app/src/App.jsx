import { useEffect, useState } from 'react'
import Nav from './components/Nav.jsx'
import Hero from './components/Hero.jsx'
import LoadingReveal from './components/LoadingReveal.jsx'
import ProductReveal from './components/ProductReveal.jsx'
import ProductShowcase from './components/ProductShowcase.jsx'
import Footer from './components/Footer.jsx'

function App() {
  const [heroReady, setHeroReady] = useState(false)
  const [loadingComplete, setLoadingComplete] = useState(false)

  useEffect(() => {
    if (loadingComplete) return undefined

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [loadingComplete])

  return (
    <>
      <div inert={!loadingComplete}>
        <Nav />
        <main>
          <Hero onReady={() => setHeroReady(true)} />
          <ProductReveal />
          <ProductShowcase />
        </main>
        <Footer />
      </div>
      {!loadingComplete && (
        <LoadingReveal heroReady={heroReady} onComplete={() => setLoadingComplete(true)} />
      )}
    </>
  )
}

export default App
