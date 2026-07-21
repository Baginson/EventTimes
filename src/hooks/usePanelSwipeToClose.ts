import { useEffect, useRef, useState } from 'react'
import type { PanInfo } from 'framer-motion'

const CLOSE_OFFSET_PX = 120
const CLOSE_VELOCITY = 450
const SNAP_BACK_TRANSITION = { type: 'spring', stiffness: 500, damping: 40, mass: 0.9 } as const

// Próg dla mocnego, zdecydowanego rzutu w dół w głębi przewiniętej treści
// (scrollTop > 0, gdzie drag framer-motion jest wyłączony, żeby nie psuć
// natywnego scrolla). Świadomie wyższy niż CLOSE_VELOCITY (drag od góry) —
// to ma być wyraźny, celowy gest, nie przypadkowe szybkie przewinięcie listy.
const FLING_CLOSE_VELOCITY_PX_S = 1300
const VELOCITY_SAMPLE_WINDOW_MS = 120

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
  const velocitySamplesRef = useRef<Array<{ y: number; time: number }>>([])
  const hasFlingClosedRef = useRef(false)

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

  // Drugi, niezależny mechanizm: gdy treść NIE jest u góry, drag framer-motion
  // jest wyłączony (patrz dragEnabled niżej), żeby nie fightować z natywnym
  // scrollem. Ale mocny, szybki rzut w dół powinien i tak zamknąć panel —
  // dlatego pasywnie (bez preventDefault, zero ingerencji w scroll) mierzymy
  // prędkość dotyku i zamykamy panel, gdy przekroczy próg, niezależnie od
  // aktualnej pozycji scrolla. Zwykłe, wolniejsze przewijanie (nawet szybkie
  // przerzucanie długiej listy) zwykle nie osiąga tej prędkości w czystym
  // kierunku pionowym w dół, więc nie zamyka przypadkowo.
  useEffect(() => {
    const node = contentRef.current

    if (!node || !enabled) {
      return
    }

    function recordSample(clientY: number) {
      const now = performance.now()
      velocitySamplesRef.current.push({ y: clientY, time: now })
      const cutoff = now - VELOCITY_SAMPLE_WINDOW_MS
      velocitySamplesRef.current = velocitySamplesRef.current.filter(
        (sample) => sample.time >= cutoff,
      )
    }

    function handlePointerDown(event: PointerEvent) {
      hasFlingClosedRef.current = false
      velocitySamplesRef.current = [{ y: event.clientY, time: performance.now() }]
    }

    function handlePointerMove(event: PointerEvent) {
      if (hasFlingClosedRef.current || !node || node.scrollTop <= 0) {
        return
      }

      recordSample(event.clientY)

      const samples = velocitySamplesRef.current

      if (samples.length < 2) {
        return
      }

      const first = samples[0]
      const last = samples[samples.length - 1]
      const deltaY = last.y - first.y
      const deltaTimeMs = last.time - first.time

      if (deltaTimeMs <= 0) {
        return
      }

      const velocityPxPerSecond = (deltaY / deltaTimeMs) * 1000

      if (deltaY > 0 && velocityPxPerSecond > FLING_CLOSE_VELOCITY_PX_S) {
        hasFlingClosedRef.current = true
        onClose()
      }
    }

    node.addEventListener('pointerdown', handlePointerDown, { passive: true })
    node.addEventListener('pointermove', handlePointerMove, { passive: true })

    return () => {
      node.removeEventListener('pointerdown', handlePointerDown)
      node.removeEventListener('pointermove', handlePointerMove)
    }
  }, [enabled, onClose])

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
