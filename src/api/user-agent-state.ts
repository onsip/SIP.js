/**
 * {@link UserAgent} state.
 * @remarks
 * Valid state transitions:
 * ```
 * 1. "initial" --> "starting"
 * 2. "starting" --> "started"
 * 3. "starting" --> "stopped"
 * 4. "started" --> "stopping"
 * 5. "started" --> "stopped"
 * 6. "stopped" --> "starting"
 * ```
 * @public
 */
export enum UserAgentState {
  Initial = "Initial",
  Starting = "Starting",
  Started = "Started",
  Stopping = "Stopping",
  Stopped = "Stopped"
}
