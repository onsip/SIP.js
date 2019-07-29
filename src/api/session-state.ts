/**
 * {@link Session} state.
 * @remarks
 * Valid state transitions:
 * ```
 * 1. "initial" --> "establishing" (before INVITE sent on outgoing, before OK sent on incoming)
 * 2. "initial" --> "established" (after ACK is sent on outgoing, after OK sent on incoming)
 * 4. "initial" --> "terminating"
 * 4. "initial" --> "terminated"
 * 5. "establishing" --> "established"
 * 6. "establishing" --> "terminating"
 * 7. "establishing" --> "terminated"
 * 8. "established" --> "terminating"
 * 9. "established" --> "terminated"
 * 10. "terminating" --> "terminated"
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
