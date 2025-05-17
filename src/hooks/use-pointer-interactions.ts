import { useEffect, RefObject, Dispatch, SetStateAction } from 'react'
import { TouchEvent as ReactTouchEvent, WheelEvent } from 'react' // Import React's TouchEvent

// Define needed types locally or import from a shared types file
interface GlobalMousePos {
  x: number
  y: number
}

interface UsePointerInteractionsProps {
  appRef: RefObject<HTMLDivElement | null>
  isStoryPanelOpen: boolean
  storyStreamRef: RefObject<HTMLDivElement | null>
  setGlobalMousePos: Dispatch<SetStateAction<GlobalMousePos>>
  setScrollProgress: Dispatch<SetStateAction<number>>
  setLastDirectInputTime: Dispatch<SetStateAction<number>>
}

export const usePointerInteractions = ({
  appRef,
  isStoryPanelOpen,
  storyStreamRef,
  setGlobalMousePos,
  setScrollProgress,
  setLastDirectInputTime,
}: UsePointerInteractionsProps): void => {
  // Effect for handling global mouse/pointer movement
  useEffect(() => {
    const currentAppRef = appRef.current
    if (!currentAppRef) return

    const handleAppPointerMove = (event: globalThis.PointerEvent) => {
      setLastDirectInputTime(Date.now())
      const x = event.clientX / window.innerWidth
      const y = event.clientY / window.innerHeight
      const amplifiedX = 0.5 + (x - 0.5) * 1.5
      const amplifiedY = 0.5 + (y - 0.5) * 1.5
      setGlobalMousePos({
        x: Math.max(0, Math.min(1, amplifiedX)),
        y: Math.max(0, Math.min(1, amplifiedY)),
      })
    }

    currentAppRef.addEventListener('pointermove', handleAppPointerMove)
    return () =>
      currentAppRef.removeEventListener('pointermove', handleAppPointerMove)
  }, [appRef, setGlobalMousePos, setLastDirectInputTime])

  // Effect for handling app-level touch and wheel interactions for scrolling
  useEffect(() => {
    const currentAppRef = appRef.current
    if (!currentAppRef) return

    const handleAppInteraction = (
      event: globalThis.Event | ReactTouchEvent<HTMLDivElement> | WheelEvent,
      isTouchEvent: boolean,
    ) => {
      setLastDirectInputTime(Date.now())
      if (
        isStoryPanelOpen &&
        storyStreamRef.current &&
        storyStreamRef.current.contains(event.target as Node)
      ) {
        return
      }
      event.preventDefault()

      const targetElement = event.target as HTMLElement & {
        _prevTouches?: Array<{ clientY: number }>
      }

      if (
        isTouchEvent &&
        (event as ReactTouchEvent<HTMLDivElement>).touches.length === 2
      ) {
        const touchEvent = event as ReactTouchEvent<HTMLDivElement>
        if (targetElement._prevTouches) {
          const prevMidY =
            (targetElement._prevTouches[0].clientY +
              targetElement._prevTouches[1].clientY) /
            2
          const currentMidY =
            (touchEvent.touches[0].clientY + touchEvent.touches[1].clientY) / 2
          const delta = (prevMidY - currentMidY) * 0.004
          setScrollProgress((prev) => Math.max(0, Math.min(1, prev + delta)))
        }
        targetElement._prevTouches = Array.from(touchEvent.touches).map(
          (t) => ({ clientY: t.clientY }),
        )
      } else if (
        isTouchEvent &&
        (event as ReactTouchEvent<HTMLDivElement>).touches.length === 1
      ) {
        if (targetElement._prevTouches) targetElement._prevTouches = undefined
      } else if (!isTouchEvent) {
        const wheelEvent = event as WheelEvent
        const scrollSensitivity = 0.04
        const delta = Math.sign(wheelEvent.deltaY) * scrollSensitivity
        setScrollProgress((prev) => Math.max(0, Math.min(1, prev + delta)))
      }
    }

    const handleAppTouchMove = (e: ReactTouchEvent<HTMLDivElement>) =>
      handleAppInteraction(e, true)
    const handleAppWheel = (e: WheelEvent) => handleAppInteraction(e, false)
    const handleAppTouchEnd = (event: ReactTouchEvent<HTMLDivElement>) => {
      const targetElement = event.target as HTMLElement & {
        _prevTouches?: Array<{ clientY: number }>
      }
      if (targetElement._prevTouches) targetElement._prevTouches = undefined
    }

    const touchMoveListener = handleAppTouchMove as unknown as EventListener
    const touchEndListener = handleAppTouchEnd as unknown as EventListener
    const wheelListener = handleAppWheel as unknown as EventListener

    currentAppRef.addEventListener('touchmove', touchMoveListener, {
      passive: false,
    })
    currentAppRef.addEventListener('touchend', touchEndListener, {
      passive: true,
    })
    currentAppRef.addEventListener('wheel', wheelListener, { passive: false })

    return () => {
      currentAppRef.removeEventListener('touchmove', touchMoveListener)
      currentAppRef.removeEventListener('touchend', touchEndListener)
      currentAppRef.removeEventListener('wheel', wheelListener)
    }
  }, [
    appRef,
    isStoryPanelOpen,
    storyStreamRef,
    setScrollProgress,
    setLastDirectInputTime,
  ])
}
