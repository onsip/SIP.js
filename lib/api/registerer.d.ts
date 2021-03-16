import { OutgoingRegisterRequest } from "../core";
import { Emitter } from "./emitter";
import { RegistererOptions } from "./registerer-options";
import { RegistererRegisterOptions } from "./registerer-register-options";
import { RegistererState } from "./registerer-state";
import { RegistererUnregisterOptions } from "./registerer-unregister-options";
import { UserAgent } from "./user-agent";
/**
 * A registerer registers a contact for an address of record (outgoing REGISTER).
 * @public
 */
export declare class Registerer {
    private static readonly defaultExpires;
    private static readonly defaultRefreshFrequency;
    private disposed;
    private id;
    private expires;
    private refreshFrequency;
    private logger;
    private options;
    private request;
    private userAgent;
    private registrationExpiredTimer;
    private registrationTimer;
    /** The contacts returned from the most recent accepted REGISTER request. */
    private _contacts;
    /** The number of seconds to wait before retrying to register. */
    private _retryAfter;
    /** The registration state. */
    private _state;
    /** Emits when the registration state changes. */
    private _stateEventEmitter;
    /** True is waiting for final response to outstanding REGISTER request. */
    private _waiting;
    /** Emits when waiting changes. */
    private _waitingEventEmitter;
    /**
     * Constructs a new instance of the `Registerer` class.
     * @param userAgent - User agent. See {@link UserAgent} for details.
     * @param options - Options bucket. See {@link RegistererOptions} for details.
     */
    constructor(userAgent: UserAgent, options?: RegistererOptions);
    /** Default registerer options. */
    private static defaultOptions;
    private static newUUID;
    /**
     * Strip properties with undefined values from options.
     * This is a work around while waiting for missing vs undefined to be addressed (or not)...
     * https://github.com/Microsoft/TypeScript/issues/13195
     * @param options - Options to reduce
     */
    private static stripUndefinedProperties;
    /** The registered contacts. */
    get contacts(): Array<string>;
    /**
     * The number of seconds to wait before retrying to register.
     * @defaultValue `undefined`
     * @remarks
     * When the server rejects a registration request, if it provides a suggested
     * duration to wait before retrying, that value is available here when and if
     * the state transitions to `Unsubscribed`. It is also available during the
     * callback to `onReject` after a call to `register`. (Note that if the state
     * if already `Unsubscribed`, a rejected request created by `register` will
     * not cause the state to transition to `Unsubscribed`. One way to avoid this
     * case is to dispose of `Registerer` when unregistered and create a new
     * `Registerer` for any attempts to retry registering.)
     * @example
     * ```ts
     * // Checking for retry after on state change
     * registerer.stateChange.addListener((newState) => {
     *   switch (newState) {
     *     case RegistererState.Unregistered:
     *       const retryAfter = registerer.retryAfter;
     *       break;
     *   }
     * });
     *
     * // Checking for retry after on request rejection
     * registerer.register({
     *   requestDelegate: {
     *     onReject: () => {
     *       const retryAfter = registerer.retryAfter;
     *     }
     *   }
     * });
     * ```
     */
    get retryAfter(): number | undefined;
    /** The registration state. */
    get state(): RegistererState;
    /** Emits when the registerer state changes. */
    get stateChange(): Emitter<RegistererState>;
    /** Destructor. */
    dispose(): Promise<void>;
    /**
     * Sends the REGISTER request.
     * @remarks
     * If successful, sends re-REGISTER requests prior to registration expiration until `unsubscribe()` is called.
     * Rejects with `RequestPendingError` if a REGISTER request is already in progress.
     */
    register(options?: RegistererRegisterOptions): Promise<OutgoingRegisterRequest>;
    /**
     * Sends the REGISTER request with expires equal to zero.
     * @remarks
     * Rejects with `RequestPendingError` if a REGISTER request is already in progress.
     */
    unregister(options?: RegistererUnregisterOptions): Promise<OutgoingRegisterRequest>;
    /**
     * Clear registration timers.
     */
    private clearTimers;
    /**
     * Generate Contact Header
     */
    private generateContactHeader;
    /**
     * Helper function, called when registered.
     */
    private registered;
    /**
     * Helper function, called when unregistered.
     */
    private unregistered;
    /**
     * Helper function, called when terminated.
     */
    private terminated;
    /**
     * Transition registration state.
     */
    private stateTransition;
    /** True if the registerer is currently waiting for final response to a REGISTER request. */
    private get waiting();
    /** Emits when the registerer waiting state changes. */
    private get waitingChange();
    /**
     * Toggle waiting.
     */
    private waitingToggle;
    /** Hopefully helpful as the standard behavior has been found to be unexpected. */
    private waitingWarning;
    /** Hopefully helpful as the standard behavior has been found to be unexpected. */
    private stateError;
}
//# sourceMappingURL=registerer.d.ts.map