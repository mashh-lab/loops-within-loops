import {
  useEffect,
  useRef,
  Dispatch,
  SetStateAction,
  MutableRefObject,
  useCallback,
} from 'react'

interface UseTypewriterProps {
  textBufferRef: MutableRefObject<string>
  isStreamCompleteRef: MutableRefObject<boolean>
  setWeatherResponse: Dispatch<SetStateAction<string>>
  typewriterSpeed: number
  autoStart?: boolean
}

export const useTypewriter = ({
  textBufferRef,
  isStreamCompleteRef,
  setWeatherResponse,
  typewriterSpeed,
  autoStart = false,
}: UseTypewriterProps) => {
  const typewriterIntervalRef = useRef<NodeJS.Timeout | null>(null)

  const clearExistingInterval = useCallback(() => {
    if (typewriterIntervalRef.current) {
      clearInterval(typewriterIntervalRef.current)
      typewriterIntervalRef.current = null
    }
  }, [])

  const runTypewriterLogic = useCallback(() => {
    if (textBufferRef.current.length > 0) {
      const charToType = textBufferRef.current.charAt(0)
      textBufferRef.current = textBufferRef.current.substring(1)
      if (charToType !== '\uFEFF') {
        // Handle potential BOM character
        setWeatherResponse((prev) => prev + charToType)
      }
    } else if (isStreamCompleteRef.current) {
      clearExistingInterval()
    }
  }, [
    textBufferRef,
    isStreamCompleteRef,
    setWeatherResponse,
    clearExistingInterval,
  ])

  const start = useCallback(() => {
    clearExistingInterval()
    typewriterIntervalRef.current = setInterval(
      runTypewriterLogic,
      typewriterSpeed,
    )
  }, [typewriterSpeed, runTypewriterLogic, clearExistingInterval])

  useEffect(() => {
    if (autoStart) {
      start()
    }
    return () => {
      clearExistingInterval()
    }
  }, [autoStart, start, clearExistingInterval])

  return { startTypewriter: start, clearTypewriter: clearExistingInterval }
}
