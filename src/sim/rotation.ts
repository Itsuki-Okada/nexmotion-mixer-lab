/**
 * Frame-rate independent rotation model.
 *
 * Two speeds are kept strictly apart:
 *  - `rpm`        : the catalog value of the selected operating point (real-machine reference)
 *  - `visualRpm`  : what the animation actually turns at = rpm × slowMotion, eased for start/stop
 *
 * Direction convention (three.js, Y up): a positive rotation about +Y is counter-clockwise when
 * viewed from above. `direction = 1` means CW-from-top, so the applied angle is `-direction * angle`.
 */
export type Direction = 1 | -1

export class RotationSim {
  rpm = 0
  slowMotion = 1 / 20
  running = false
  paused = false
  direction: Direction = 1
  /** eased animation speed in rpm (signed, CCW-from-top positive) */
  visualRpm = 0
  /** accumulated output-shaft angle in radians, CCW-from-top positive */
  angle = 0
  private listeners = new Set<() => void>()

  /** seconds for the speed to cover ~63% of the gap on START / STOP (inertia feel) */
  tau = 0.45

  get targetVisualRpm() {
    return this.running ? -this.direction * this.rpm * this.slowMotion : 0
  }

  update(dt: number) {
    if (this.paused) return
    // clamp huge gaps (tab switch) so the model does not jump
    const d = Math.min(dt, 0.1)
    const k = 1 - Math.exp(-d / this.tau)
    this.visualRpm += (this.targetVisualRpm - this.visualRpm) * k
    if (Math.abs(this.visualRpm) < 1e-4 && !this.running) this.visualRpm = 0
    this.angle += (this.visualRpm / 60) * Math.PI * 2 * d
    if (this.angle > 1e6 || this.angle < -1e6) this.angle %= Math.PI * 2
  }

  /** visual rad/s, CCW-from-top positive */
  get omega() {
    return (this.visualRpm / 60) * Math.PI * 2
  }

  set(patch: Partial<Pick<RotationSim, 'rpm' | 'slowMotion' | 'running' | 'paused' | 'direction'>>) {
    Object.assign(this, patch)
    this.emit()
  }

  reset() {
    this.running = false
    this.paused = false
    this.visualRpm = 0
    this.angle = 0
    this.direction = 1
    this.emit()
  }

  subscribe(fn: () => void) {
    this.listeners.add(fn)
    return () => {
      this.listeners.delete(fn)
    }
  }

  private emit() {
    this.listeners.forEach((f) => f())
  }
}
