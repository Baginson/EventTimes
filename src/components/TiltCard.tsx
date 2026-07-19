import { type MouseEvent, type ReactNode, useEffect, useState } from 'react'
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion'

type TiltCardProps = {
  children: ReactNode
  perspective?: number
  tiltFactor?: number
}

const springConfig = {
  damping: 30,
  stiffness: 400,
  mass: 0.5,
}

export function TiltCard({
  children,
  perspective = 1000,
  tiltFactor = 8,
}: TiltCardProps) {
  const [isTiltEnabled, setIsTiltEnabled] = useState(false)
  const pointerX = useMotionValue(0)
  const pointerY = useMotionValue(0)
  const springX = useSpring(pointerX, springConfig)
  const springY = useSpring(pointerY, springConfig)
  const rotateY = useTransform(springX, (latest) => latest * tiltFactor)
  const rotateX = useTransform(springY, (latest) => latest * -tiltFactor)

  useEffect(() => {
    const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    const finePointerQuery = window.matchMedia('(pointer: fine)')

    const updateTiltAvailability = () => {
      setIsTiltEnabled(!reducedMotionQuery.matches && finePointerQuery.matches)
    }

    updateTiltAvailability()
    reducedMotionQuery.addEventListener('change', updateTiltAvailability)
    finePointerQuery.addEventListener('change', updateTiltAvailability)

    return () => {
      reducedMotionQuery.removeEventListener('change', updateTiltAvailability)
      finePointerQuery.removeEventListener('change', updateTiltAvailability)
    }
  }, [])

  if (!isTiltEnabled) {
    return <div className="tilt-card">{children}</div>
  }

  const handleMouseMove = (event: MouseEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect()

    if (rect.width === 0 || rect.height === 0) {
      return
    }

    pointerX.set(((event.clientX - rect.left) / rect.width - 0.5) * 2)
    pointerY.set(((event.clientY - rect.top) / rect.height - 0.5) * 2)
  }

  const handleMouseLeave = () => {
    pointerX.set(0)
    pointerY.set(0)
  }

  return (
    <motion.div
      className="tilt-card"
      onMouseLeave={handleMouseLeave}
      onMouseMove={handleMouseMove}
      style={{ perspective }}
    >
      <motion.div
        className="tilt-card-inner"
        style={{ rotateX, rotateY, transformStyle: 'preserve-3d' }}
      >
        {children}
      </motion.div>
    </motion.div>
  )
}
