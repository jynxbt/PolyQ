/**
 * A Stage represents one step in the workspace startup sequence.
 * Each stage can check if it's already running, start, and stop.
 */
export interface Stage {
  /** Display name for logging */
  name: string

  /** Check if the stage is already in the desired state */
  check(): Promise<boolean>

  /** Start or ensure the stage is running */
  start(): Promise<void>

  /** Stop the stage */
  stop(): Promise<void>
}
