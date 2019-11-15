import { Contact, IncomingRequestMessage, Logger, LoggerFactory, Transport, URI, UserAgentCore } from "../core";
import { Inviter } from "./inviter";
import { InviterOptions } from "./inviter-options";
import { Publisher } from "./publisher";
import { Registerer } from "./registerer";
import { Session } from "./session";
import { Subscription } from "./subscription";
import { UserAgentDelegate } from "./user-agent-delegate";
import { UserAgentOptions } from "./user-agent-options";
/**
 * A user agent sends and receives requests using a `Transport`.
 *
 * @remarks
 * A user agent (UA) is associated with a user via the user's SIP address of record (AOR)
 * and acts on behalf of that user to send and receive SIP requests. The user agent can
 * register to receive incoming requests, as well as create and send outbound messages.
 * The user agent also maintains the Transport over which its signaling travels.
 *
 * @public
 */
export declare class UserAgent {
    /**
     * Create a URI instance from a string.
     * @param uri - The string to parse.
     *
     * @example
     * ```ts
     * const uri = UserAgent.makeURI("sip:edgar@example.com");
     * ```
     */
    static makeURI(uri: string): URI | undefined;
    /**
     * Strip properties with undefined values from options.
     * This is a work around while waiting for missing vs undefined to be addressed (or not)...
     * https://github.com/Microsoft/TypeScript/issues/13195
     * @param options - Options to reduce
     */
    protected static stripUndefinedProperties(options: Partial<UserAgentOptions>): Partial<UserAgentOptions>;
    /** Default user agent options. */
    private static readonly defaultOptions;
    /** Delegate. */
    delegate: UserAgentDelegate | undefined;
    /** @internal */
    data: any;
    /** @internal */
    applicants: {
        [id: string]: Inviter;
    };
    /** @internal */
    publishers: {
        [id: string]: Publisher;
    };
    /** @internal */
    registerers: {
        [id: string]: Registerer;
    };
    /** @internal */
    sessions: {
        [id: string]: Session;
    };
    /** @internal */
    subscriptions: {
        [id: string]: Subscription;
    };
    /** @internal */
    transport: Transport;
    /** @internal */
    contact: Contact;
    /** @internal */
    userAgentCore: UserAgentCore;
    /** Logger. */
    private logger;
    /** LoggerFactory. */
    private loggerFactory;
    /** Options. */
    private options;
    private _state;
    private _stateEventEmitter;
    /** @internal */
    private status;
    /** Unload listener. */
    private unloadListener;
    /**
     * Constructs a new instance of the `UserAgent` class.
     * @param options - Options bucket. See {@link UserAgentOptions} for details.
     */
    constructor(options?: Partial<UserAgentOptions>);
    /**
     * User agent configuration.
     */
    readonly configuration: Required<UserAgentOptions>;
    /**
     * Connect user agent to network transport.
     * @remarks
     * Connect to the WS server if status = STATUS_INIT.
     * Resume UA after being closed.
     */
    start(): Promise<void>;
    /**
     * Gracefully close.
     * Gracefully disconnect from network transport.
     * @remarks
     * Unregisters and terminates active sessions/subscriptions.
     */
    stop(): Promise<void>;
    /** @internal */
    findSession(request: IncomingRequestMessage): Session | undefined;
    /** @internal */
    getLogger(category: string, label?: string): Logger;
    /** @internal */
    getLoggerFactory(): LoggerFactory;
    /** @internal */
    getSupportedResponseOptions(): Array<string>;
    /** @internal */
    makeInviter(targetURI: URI, options?: InviterOptions): Inviter;
    private onTransportError;
    /**
     * Helper function. Sets transport listeners
     */
    private setTransportListeners;
    /**
     * Transport connection event.
     */
    private onTransportConnected;
    /**
     * Handle SIP message received from the transport.
     * @param messageString - The message.
     */
    private onTransportReceiveMsg;
    private initContact;
    private initCore;
}
//# sourceMappingURL=user-agent.d.ts.map