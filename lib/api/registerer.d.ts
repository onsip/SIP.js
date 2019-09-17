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
    private id;
    private contact;
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
     * If successfull, sends re-REGISTER requests prior to registration expiration until `unsubscribe()` is called.
     */
    register(options?: RegistererRegisterOptions): Promise<OutgoingRegisterRequest>;
    /**
     * Sends the REGISTER request with expires equal to zero.
     */
    unregister(options?: RegistererUnregisterOptions): Promise<OutgoingRegisterRequest>;
    /** @internal */
    private clearTimers;
    /**
     * Helper Function to generate Contact Header
     * @internal
     */
    private generateContactHeader;
    /** @internal */
    private onTransportDisconnected;
    /** @internal */
    private registered;
    /** @internal */
    private unregistered;
    /**
     * Transition registration state.
     * @internal
     */
    private stateTransition;
    /** True if waiting for final response to a REGISTER request. */
    private readonly waiting;
    /** Emits when the registerer toggles waiting. */
    private readonly waitingChange;
    /**
     * Toggle waiting.
     * @internal
     */
    private waitingToggle;
}
//# sourceMappingURL=registerer.d.ts.map