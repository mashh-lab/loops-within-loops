import { useEffect, RefObject, Dispatch, SetStateAction } from 'react'

interface UseStoryPanelScrollProps {
  isStoryPanelOpen: boolean
  storyStreamRef: RefObject<HTMLDivElement | null>
  setScrollProgress: Dispatch<SetStateAction<number>>
  setLastDirectInputTime: Dispatch<SetStateAction<number>>
}

export const useStoryPanelScroll = ({
  isStoryPanelOpen,
  storyStreamRef,
  setScrollProgress,
  setLastDirectInputTime,
}: UseStoryPanelScrollProps): void => {
  useEffect(() => {
    if (!isStoryPanelOpen) return

    const storyContainer = storyStreamRef.current
    if (!storyContainer) return

    let scrollerElement: HTMLElement | null = null
    let mutationObserver: MutationObserver | null = null

    const handleTextScroll = () => {
      setLastDirectInputTime(Date.now())
      if (!scrollerElement) return

      const { scrollTop, scrollHeight, clientHeight } = scrollerElement
      const totalScrollableHeight = scrollHeight - clientHeight
      const currentTextScrollProgress =
        totalScrollableHeight > 0
          ? Math.min(scrollTop / totalScrollableHeight, 1.0)
          : clientHeight >= scrollHeight
            ? 0
            : 1
      setScrollProgress(currentTextScrollProgress)
    }

    const setupScroller = (scroller: HTMLElement) => {
      scrollerElement = scroller
      handleTextScroll() // Initial call to set progress
      scrollerElement.addEventListener('scroll', handleTextScroll)
    }

    const scroller = storyContainer.querySelector(
      '.story-content-wrapper',
    ) as HTMLElement | null

    if (scroller) {
      setupScroller(scroller)
    } else {
      mutationObserver = new MutationObserver((_, obs) => {
        const scrollerCheck = storyContainer.querySelector(
          '.story-content-wrapper',
        ) as HTMLElement | null
        if (scrollerCheck) {
          setupScroller(scrollerCheck)
          obs.disconnect() // Stop observing once found
          mutationObserver = null // Clear the observer instance
        }
      })
      mutationObserver.observe(storyContainer, {
        childList: true,
        subtree: true,
      })
    }

    return () => {
      if (scrollerElement) {
        scrollerElement.removeEventListener('scroll', handleTextScroll)
      }
      if (mutationObserver) {
        mutationObserver.disconnect()
      }
    }
  }, [
    isStoryPanelOpen,
    storyStreamRef,
    setScrollProgress,
    setLastDirectInputTime,
  ])
}
