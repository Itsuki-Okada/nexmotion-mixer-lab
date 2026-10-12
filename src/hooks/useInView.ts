import { useEffect, useRef, useState } from 'react'

/** Tracks whether an element is near the viewport (used to pause offscreen WebGL views). */
export function useInView<T extends Element>(rootMargin = '0px', once = false) {
  const ref = useRef<T>(null)
  const [inView, setInView] = useState(false)
  const [seen, setSeen] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el || typeof IntersectionObserver === 'undefined') {
      setInView(true)
      setSeen(true)
      return
    }
    const io = new IntersectionObserver(
      ([e]) => {
        setInView(e.isIntersecting)
        if (e.isIntersecting) setSeen(true)
        if (once && e.isIntersecting) io.disconnect()
      },
      { rootMargin },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [rootMargin, once])
  return [ref, inView, seen] as const
}
