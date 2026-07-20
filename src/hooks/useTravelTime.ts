import { useCallback, useEffect, useRef, useState } from 'react'
import { EventTimesApiConfigError } from '../services/eventTimesApi'
import { fetchTravelTime } from '../services/travelTimeService'
import type {
  TravelCoordinates,
  TravelMode,
  TravelTimeResult,
} from '../services/travelTimeService'

export type TravelTimeErrorKind =
  | 'config'
  | 'geolocation-unsupported'
  | 'permission-denied'
  | 'position-unavailable'
  | 'geolocation-timeout'
  | 'no-destination'
  | 'request-failed'

export type TravelTimeState =
  | { status: 'idle' }
  | { status: 'locating' }
  | { status: 'loading' }
  | { status: 'success'; result: TravelTimeResult }
  | { status: 'error'; kind: TravelTimeErrorKind }

const GEOLOCATION_TIMEOUT_MS = 12000

export function useTravelTime(destination: TravelCoordinates | null) {
  const [mode, setMode] = useState<TravelMode>('drive')
  const [state, setState] = useState<TravelTimeState>({ status: 'idle' })
  // Lokalizacja użytkownika żyje wyłącznie w pamięci tego hooka — nigdy nie
  // trafia do Firestore, storage, URL ani logów.
  const originRef = useRef<TravelCoordinates | null>(null)
  const requestIdRef = useRef(0)

  useEffect(() => {
    requestIdRef.current += 1
    originRef.current = null
    setMode('drive')
    setState({ status: 'idle' })
  }, [destination?.lat, destination?.lng])

  useEffect(() => {
    return () => {
      requestIdRef.current += 1
    }
  }, [])

  const compute = useCallback(
    async (origin: TravelCoordinates, travelMode: TravelMode) => {
      if (!destination) {
        setState({ status: 'error', kind: 'no-destination' })
        return
      }

      const requestId = ++requestIdRef.current
      setState({ status: 'loading' })

      try {
        const result = await fetchTravelTime(origin, destination, travelMode)

        if (requestIdRef.current === requestId) {
          setState({ status: 'success', result })
        }
      } catch (error) {
        if (requestIdRef.current !== requestId) {
          return
        }

        setState({
          status: 'error',
          kind: error instanceof EventTimesApiConfigError ? 'config' : 'request-failed',
        })
      }
    },
    [destination],
  )

  const check = useCallback(
    (requestedMode?: TravelMode) => {
      const travelMode = requestedMode ?? mode

      if (!destination) {
        setState({ status: 'error', kind: 'no-destination' })
        return
      }

      if (originRef.current) {
        void compute(originRef.current, travelMode)
        return
      }

      if (typeof navigator === 'undefined' || !navigator.geolocation) {
        setState({ status: 'error', kind: 'geolocation-unsupported' })
        return
      }

      const requestId = ++requestIdRef.current
      setState({ status: 'locating' })

      navigator.geolocation.getCurrentPosition(
        (position) => {
          if (requestIdRef.current !== requestId) {
            return
          }

          const origin = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          }
          originRef.current = origin
          void compute(origin, travelMode)
        },
        (geolocationError) => {
          if (requestIdRef.current !== requestId) {
            return
          }

          const kind: TravelTimeErrorKind =
            geolocationError.code === geolocationError.PERMISSION_DENIED
              ? 'permission-denied'
              : geolocationError.code === geolocationError.TIMEOUT
                ? 'geolocation-timeout'
                : 'position-unavailable'
          setState({ status: 'error', kind })
        },
        {
          enableHighAccuracy: false,
          timeout: GEOLOCATION_TIMEOUT_MS,
          maximumAge: 60000,
        },
      )
    },
    [compute, destination, mode],
  )

  const selectMode = useCallback(
    (nextMode: TravelMode) => {
      setMode(nextMode)

      if (nextMode !== mode && originRef.current && state.status !== 'idle') {
        void compute(originRef.current, nextMode)
      }
    },
    [compute, mode, state.status],
  )

  return { mode, state, check, selectMode }
}
