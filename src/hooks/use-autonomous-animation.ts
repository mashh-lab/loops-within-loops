import { useEffect, RefObject, Dispatch, SetStateAction } from 'react'

// Define needed types locally or import from a shared types file
interface GlobalMousePos {
  x: number
  y: number
}

// Helper function (if not already defined globally or imported)
const lerp = (start: number, end: number, amt: number): number =>
  (1 - amt) * start + amt * end

interface UseAutonomousAnimationProps {
  lastDirectInputTime: number
  isStoryPanelOpen: boolean
  appRef: RefObject<HTMLDivElement | null>
  storyStreamRef: RefObject<HTMLDivElement | null>
  setGlobalMousePos: Dispatch<SetStateAction<GlobalMousePos>>
  setScrollProgress: Dispatch<SetStateAction<number>>
  autonomousScrollBaseRef: RefObject<number>
  lastAnimationTimeRef: RefObject<number>
  USER_INPUT_IDLE_THRESHOLD: number
  AUTONOMOUS_CIRCLE_SPEED: number
  AUTONOMOUS_MOUSE_RADIUS: number
  AUTONOMOUS_SCROLL_DRIFT_PER_SEC: number
  LERP_FACTOR: number
}

export const useAutonomousAnimation = ({
  lastDirectInputTime,
  isStoryPanelOpen,
  setGlobalMousePos,
  setScrollProgress,
  autonomousScrollBaseRef,
  lastAnimationTimeRef,
  USER_INPUT_IDLE_THRESHOLD,
  AUTONOMOUS_CIRCLE_SPEED,
  AUTONOMOUS_MOUSE_RADIUS,
  AUTONOMOUS_SCROLL_DRIFT_PER_SEC,
  LERP_FACTOR,
}: UseAutonomousAnimationProps): void => {
  useEffect(() => {
    let animationFrameId: number
    const animate = () => {
      const now = Date.now()
      const deltaTime = now - (lastAnimationTimeRef.current || now)
      lastAnimationTimeRef.current = now

      if (now - lastDirectInputTime > USER_INPUT_IDLE_THRESHOLD) {
        const angle = (now / AUTONOMOUS_CIRCLE_SPEED) % (2 * Math.PI)
        const targetAutoMouseX = 0.5 + AUTONOMOUS_MOUSE_RADIUS * Math.cos(angle)
        const targetAutoMouseY = 0.5 + AUTONOMOUS_MOUSE_RADIUS * Math.sin(angle)
        setGlobalMousePos((prevPos) => ({
          x: lerp(prevPos.x, targetAutoMouseX, LERP_FACTOR),
          y: lerp(prevPos.y, targetAutoMouseY, LERP_FACTOR),
        }))

        if (!isStoryPanelOpen) {
          if (autonomousScrollBaseRef.current !== null) {
            autonomousScrollBaseRef.current +=
              (AUTONOMOUS_SCROLL_DRIFT_PER_SEC / 1000) * deltaTime
            if (autonomousScrollBaseRef.current > 1) {
              autonomousScrollBaseRef.current -= 1
            }
            const targetAutoScrollVal = autonomousScrollBaseRef.current
            setScrollProgress((prevScroll) =>
              lerp(prevScroll, targetAutoScrollVal, LERP_FACTOR),
            )
          }
        }
      }
      animationFrameId = requestAnimationFrame(animate)
    }

    if (lastAnimationTimeRef.current === null) {
      lastAnimationTimeRef.current = Date.now()
    }
    animationFrameId = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(animationFrameId)
  }, [
    lastDirectInputTime,
    isStoryPanelOpen,
    setGlobalMousePos,
    setScrollProgress,
    autonomousScrollBaseRef,
    lastAnimationTimeRef,
    USER_INPUT_IDLE_THRESHOLD,
    AUTONOMOUS_CIRCLE_SPEED,
    AUTONOMOUS_MOUSE_RADIUS,
    AUTONOMOUS_SCROLL_DRIFT_PER_SEC,
    LERP_FACTOR,
  ])
}
