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
    /** Default registerer options. */
    private static readonly defaultOptions;
    private static newUUID;
    /**
     * Strip properties with undefined values from options.
     * This is a work around while waiting for missing vs undefined to be addressed (or not)...
     * https://github.com/Microsoft/TypeScript/issues/13195
     * @param options - Options to reduce
     */
    private static stripUndefinedProperties;
    private disposed;
    private id;
    private expires;
    private logger;
    private options;
    private request;
    private userAgent;
    private registrationExpiredTimer;
    private registrationTimer;
    /** The contacts returned from the most recent accepted REGISTER request. */
    private _contacts;
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
    /** The registered contacts. */
    readonly contacts: Array<string>;
    /** The registration state. */
    readonly state: RegistererState;
    /** Emits when the registerer state changes. */
    readonly stateChange: Emitter<RegistererState>;
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
    private readonly waiting;
    /** Emits when the registerer waiting state changes. */
    private readonly waitingChange;
    /**
     * Toggle waiting.
     */
    private waitingToggle;
}
//# sourceMappingURL=registerer.d.ts.map