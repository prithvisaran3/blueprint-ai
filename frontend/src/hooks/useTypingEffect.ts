import { useEffect, useState } from 'react'

interface Options {
  /** ms per character while typing. */
  typingSpeed?: number
  /** ms per character while deleting. */
  deletingSpeed?: number
  /** pause after a phrase finishes typing. */
  pauseMs?: number
}

/** Cycles through phrases with a typewriter + delete effect. */
export function useTypingEffect(phrases: string[], options: Options = {}) {
  const { typingSpeed = 55, deletingSpeed = 28, pauseMs = 1600 } = options
  const [text, setText] = useState('')
  const [phraseIndex, setPhraseIndex] = useState(0)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    const current = phrases[phraseIndex % phrases.length]
    let timeout: ReturnType<typeof setTimeout>

    if (!deleting && text === current) {
      timeout = setTimeout(() => setDeleting(true), pauseMs)
    } else if (deleting && text === '') {
      // Advance to the next phrase via a timeout so we never setState
      // synchronously inside the effect body (avoids cascading renders).
      timeout = setTimeout(() => {
        setDeleting(false)
        setPhraseIndex((i) => (i + 1) % phrases.length)
      }, 320)
    } else {
      timeout = setTimeout(
        () => {
          setText((prev) =>
            deleting ? current.slice(0, prev.length - 1) : current.slice(0, prev.length + 1),
          )
        },
        deleting ? deletingSpeed : typingSpeed,
      )
    }

    return () => clearTimeout(timeout)
  }, [text, deleting, phraseIndex, phrases, typingSpeed, deletingSpeed, pauseMs])

  return text
}
