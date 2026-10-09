import { useEffect, useRef, useState } from 'react'

/** True once the element has scrolled into view. Without IntersectionObserver it is simply true. */
export function useReveal<T extends HTMLElement>() {
  const ref = useRef<T>(null)
  const [seen, setSeen] = useState(() => typeof IntersectionObserver === 'undefined')

  useEffect(() => {
    const node = ref.current
    if (seen || !node) return
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setSeen(true)
          io.disconnect()
        }
      },
      { threshold: 0.01, rootMargin: '150px 0px' },
    )
    io.observe(node)
    return () => io.disconnect()
  }, [seen])

  return { ref, seen }
}
