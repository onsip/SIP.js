/**
 * {@link Transport} state.
 *
 * @remarks
 * Valid state transitions:
 * ```
 * 1. "connecting" --> "connected"       - connect() resolved
 * 2. "connecting" --> "disconnecting"   - disconnect() was called
 * 3. "connecting" --> "disconnected"    - connect() rejected
 * 4. "connected" --> "disconnecting"    - disconnect() was called
 * 5. "connected" --> "disconnected"     - triggered from network side
 * 6. "disconnecting" --> "connecting"   - connect() was called
 * 7. "disconnecting" --> "disconnected" - disconnect() completed
 * 8. "disconnected" --> "connecting"    - connect() was called
 * ```
 * @public
 */
export enum TransportState {
  Connecting = "Connecting",
  Connected = "Connected",
  Disconnecting = "Disconnecting",
  Disconnected = "Disconnected"
}
