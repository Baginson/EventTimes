import { useEffect, useRef, useState } from 'react'
import type { PanInfo } from 'framer-motion'

const CLOSE_OFFSET_PX = 120
const CLOSE_VELOCITY = 450
const SNAP_BACK_TRANSITION = { type: 'spring', stiffness: 500, damping: 40, mass: 0.9 } as const

type PanelDragEvent = MouseEvent | TouchEvent | PointerEvent

type UsePanelSwipeToCloseOptions = {
  onClose: () => void
  enabled: boolean
}

export function usePanelSwipeToClose({
  onClose,
  enabled,
}: UsePanelSwipeToCloseOptions) {
  const [isAtTop, setIsAtTop] = useState(true)
  const contentRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const node = contentRef.current

    if (!node || !enabled) {
      return
    }

    const handleScroll = () => setIsAtTop(node.scrollTop <= 0)

    handleScroll()
    node.addEventListener('scroll', handleScroll, { passive: true })

    return () => node.removeEventListener('scroll', handleScroll)
  }, [enabled])

  function handleDragEnd(_event: PanelDragEvent, info: PanInfo) {
    if (info.offset.y > CLOSE_OFFSET_PX || info.velocity.y > CLOSE_VELOCITY) {
      onClose()
    }
  }

  const dragEnabled = enabled && isAtTop

  return {
    contentRef,
    drag: (dragEnabled ? 'y' : false) as 'y' | false,
    dragConstraints: { top: 0, bottom: 0 },
    dragElastic: { top: 0, bottom: 1 },
    dragMomentum: true,
    dragTransition: SNAP_BACK_TRANSITION,
    onDragEnd: handleDragEnd,
  }
}
