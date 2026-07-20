import { useReducedMotion } from 'framer-motion'
import { MOBILE_PANEL_MEDIA_QUERY } from '../constants/breakpoints'
import { useMediaQuery } from './useMediaQuery'

const easeOut = [0.2, 0.8, 0.2, 1] as const

export function usePanelMotion() {
  const shouldReduceMotion = useReducedMotion()
  const isMobilePanel = useMediaQuery(MOBILE_PANEL_MEDIA_QUERY)

  if (shouldReduceMotion) {
    return {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      exit: { opacity: 0 },
      transition: { duration: 0.12 },
    }
  }

  if (isMobilePanel) {
    return {
      initial: { opacity: 0, transform: 'translateY(12px)' },
      animate: { opacity: 1, transform: 'translateY(0)' },
      exit: { opacity: 0, transform: 'translateY(12px)' },
      transition: { duration: 0.22, ease: easeOut },
    }
  }

  return {
    initial: { opacity: 0, transform: 'translateX(24px) scale(0.985)' },
    animate: { opacity: 1, transform: 'translateX(0) scale(1)' },
    exit: { opacity: 0, transform: 'translateX(18px) scale(0.985)' },
    transition: { duration: 0.22, ease: easeOut },
  }
}
