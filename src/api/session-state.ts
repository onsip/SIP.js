/**
 * {@link Session} state.
 * @remarks
 * Valid state transitions:
 * ```
 * 1. "initial" --> "establishing" (just before INVITE sent on outgoing, just before OK sent on incoming)
 * 2. "initial" --> "terminating"
 * 3. "initial" --> "terminated"
 * 4. "establishing" --> "established" (just after ACK is sent on outgoing, just after OK sent on incoming)
 * 5. "establishing" --> "terminating"
 * 6. "establishing" --> "terminated"
 * 7. "established" --> "terminating"
 * 8. "established" --> "terminated"
 * 9. "terminating" --> "terminated"
 * ```
 * @public
 */
export enum SessionState {
  Initial = "Initial",
  Establishing = "Establishing",
  Established = "Established",
  Terminating = "Terminating",
  Terminated = "Terminated"
}
