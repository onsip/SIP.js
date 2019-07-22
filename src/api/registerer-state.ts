/**
 * {@link Registerer} state.
 * @remarks
 * Valid state transitions:
 * ```
 * 1. "initial" --> "registered"
 * 2. "initial" --> "unregistered"
 * 3. "registered" --> "unregistered"
 * 3. "unregistered" --> "registered"
 * ```
 * @public
 */
export enum RegistererState {
  Initial = "Initial",
  Registered =  "Registered",
  Unregistered = "Unregistered"
}
