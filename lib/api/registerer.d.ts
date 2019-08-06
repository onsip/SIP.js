/// <reference types="node" />
import { EventEmitter } from "events";
import { IncomingResponseMessage } from "../core";
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
export declare class Registerer extends EventEmitter {
    registered: boolean;
    private options;
    private expires;
    private contact;
    private registrationTimer;
    private registrationExpiredTimer;
    private registeredBefore;
    private closeHeaders;
    private receiveResponse;
    private ua;
    private logger;
    private request;
    private _contacts;
    /** The registration state. */
    private _state;
    /** Emits when the registration state changes. */
    private _stateEventEmitter;
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
    /** Emits when the referrer state changes. */
    readonly stateChange: Emitter<RegistererState>;
    register(options?: RegistererRegisterOptions): Promise<void>;
    unregister(options?: RegistererUnregisterOptions): Promise<void>;
    /** @internal */
    close(): void;
    /** @internal */
    unregistered(response?: IncomingResponseMessage, cause?: string): void;
    /** @internal */
    send(): Promise<void>;
    private registrationFailure;
    private onTransportDisconnected;
    /**
     * Helper Function to generate Contact Header
     * @internal
     */
    private generateContactHeader;
    /**
     * Transition registration state.
     * @internal
     */
    private stateTransition;
}
//# sourceMappingURL=registerer.d.ts.map