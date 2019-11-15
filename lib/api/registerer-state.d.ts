/**
 * {@link Registerer} state.
 * @remarks
 * Valid state transitions:
 * ```
 * 1. "initial" --> "registered"
 * 2. "initial" --> "unregistered"
 * 3. "initial" --> "terminated"
 * 4. "registered" --> "unregistered"
 * 5. "registered" --> "terminated"
 * 6. "unregistered" --> "registered"
 * 7. "unregistered" --> "terminated"
 * ```
 * @public
 */
export declare enum RegistererState {
    Initial = "Initial",
    Registered = "Registered",
    Unregistered = "Unregistered",
    Terminated = "Terminated"
}
//# sourceMappingURL=registerer-state.d.ts.map