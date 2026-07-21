import { useEffect, useRef } from 'react'
import type { PointerEvent as ReactPointerEvent } from 'react'
import { useDragControls } from 'framer-motion'
import type { PanInfo } from 'framer-motion'

const CLOSE_OFFSET_PX = 120
const CLOSE_VELOCITY = 450
// dragTransition oczekuje InertiaOptions (parametry odbicia od ograniczeń
// drag, nie generycznego springa) — bounceStiffness/bounceDamping tuningują
// to, jak panel "doskakuje" z powrotem do 0, gdy puszczenie nie przekroczyło
// progu zamknięcia.
const SNAP_BACK_TRANSITION = { bounceStiffness: 500, bounceDamping: 40 } as const

type PanelDragEvent = MouseEvent | TouchEvent | PointerEvent

type UsePanelSwipeToCloseOptions = {
  onClose: () => void
  enabled: boolean
}

// Wzorzec "uchwyt + pull-from-top" znany z Google Maps / Facebooka (patrz
// docs/DECISIONS.md): uchwyt panelu zawsze inicjuje przeciąganie, niezależnie
// od pozycji scrolla treści; dotyk zaczęty na samej treści inicjuje je tylko,
// gdy scroll jest już na górze (klasyczny "rubber-band pull"). Świadomie bez
// prób wykrywania "mocnego rzutu gdziekolwiek" po samej prędkości — to
// konfliktowało ze zwykłym szybkim przewijaniem treści w praktyce.
export function usePanelSwipeToClose({
  onClose,
  enabled,
}: UsePanelSwipeToCloseOptions) {
  const dragControls = useDragControls()
  const contentRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const node = contentRef.current

    if (!node || !enabled) {
      return
    }

    function handleContentPointerDown(event: PointerEvent) {
      if (node && node.scrollTop <= 0) {
        dragControls.start(event)
      }
    }

    node.addEventListener('pointerdown', handleContentPointerDown)

    return () => node.removeEventListener('pointerdown', handleContentPointerDown)
  }, [enabled, dragControls])

  function handleHandlePointerDown(event: ReactPointerEvent<HTMLElement>) {
    if (enabled) {
      dragControls.start(event)
    }
  }

  function handleDragEnd(_event: PanelDragEvent, info: PanInfo) {
    if (info.offset.y > CLOSE_OFFSET_PX || info.velocity.y > CLOSE_VELOCITY) {
      onClose()
    }
  }

  return {
    contentRef,
    dragControls,
    handleProps: { onPointerDown: handleHandlePointerDown },
    drag: (enabled ? 'y' : false) as 'y' | false,
    dragListener: false,
    dragConstraints: { top: 0, bottom: 0 },
    dragElastic: { top: 0, bottom: 1 },
    dragMomentum: true,
    dragTransition: SNAP_BACK_TRANSITION,
    onDragEnd: handleDragEnd,
  }
}
