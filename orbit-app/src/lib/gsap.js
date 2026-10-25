import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'

gsap.registerPlugin(ScrollTrigger, useGSAP)

// Mobile browsers resize the viewport when the address bar shows/hides;
// ignoring those resizes keeps the pinned hero from re-measuring mid-scroll.
ScrollTrigger.config({ ignoreMobileResize: true })

export { gsap, ScrollTrigger, useGSAP }
