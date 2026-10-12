import { useEffect, useMemo, useState } from 'react'
import { RotationSim } from '../sim/rotation'

export function useSim(init?: Partial<Pick<RotationSim, 'rpm' | 'slowMotion' | 'running' | 'direction'>>) {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const sim = useMemo(() => Object.assign(new RotationSim(), init), [])
  const [, force] = useState(0)
  useEffect(() => sim.subscribe(() => force((n) => n + 1)), [sim])
  return sim
}

/** Re-render at a modest rate to show live animation values (angle, eased speed). */
export function useTicker(hz = 12, enabled = true) {
  const [t, setT] = useState(0)
  useEffect(() => {
    if (!enabled) return
    const id = setInterval(() => setT((n) => n + 1), 1000 / hz)
    return () => clearInterval(id)
  }, [hz, enabled])
  return t
}
