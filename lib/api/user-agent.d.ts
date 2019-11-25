import { Contact, IncomingRequestMessage, Logger, LoggerFactory, URI, UserAgentCore } from "../core";
import { Emitter } from "./emitter";
import { Inviter } from "./inviter";
import { InviterOptions } from "./inviter-options";
import { Publisher } from "./publisher";
import { Registerer } from "./registerer";
import { Session } from "./session";
import { Subscription } from "./subscription";
import { Transport } from "./transport";
import { UserAgentDelegate } from "./user-agent-delegate";
import { UserAgentOptions } from "./user-agent-options";
import { UserAgentState } from "./user-agent-state";
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
    private _contact;
    private _state;
    private _stateEventEmitter;
    private _stateInitial;
    private _transport;
    private _userAgentCore;
    /** Logger. */
    private logger;
    /** LoggerFactory. */
    private loggerFactory;
    /** Options. */
    private options;
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
     * User agent contact.
     */
    readonly contact: Contact;
    /**
     * User agent state.
     */
    readonly state: UserAgentState;
    /**
     * User agent state change emitter.
     */
    readonly stateChange: Emitter<UserAgentState>;
    /**
     * User agent transport.
     */
    readonly transport: Transport;
    /**
     * User agent core.
     */
    readonly userAgentCore: UserAgentCore;
    /**
     * True if transport is connected.
     */
    isConnected(): boolean;
    /**
     * Reconnect the transport.
     */
    reconnect(): Promise<void>;
    /**
     * Start the user agent.
     *
     * @remarks
     * Resolves if transport connects, otherwise rejects.
     *
     * @example
     * ```ts
     * userAgent.start()
     *   .then(() => {
     *     // userAgent.isConnected() === true
     *   })
     *   .catch((error: Error) => {
     *     // userAgent.isConnected() === false
     *   });
     * ```
     */
    start(): Promise<void>;
    /**
     * Stop the user agent.
     *
     * @remarks
     * Resolves when the user agent has completed a graceful shutdown.
     *
     * Registerers unregister. Sessions terminate. Subscribers unsubscribe. Publishers unpublish.
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
    /**
     * Used to avoid circular references.
     * @internal
     */
    makeInviter(targetURI: URI, options?: InviterOptions): Inviter;
    /**
     * Attempt reconnection up to `maxReconnectionAttempts` times.
     * @param reconnectionAttempt - Current attempt number.
     */
    private attemptReconnection;
    /**
     * Initialize contact.
     */
    private initContact;
    /**
     * Initialize user agent core.
     */
    private initCore;
    private initTransportCallbacks;
    private onTransportConnect;
    private onTransportDisconnect;
    private onTransportMessage;
    /**
     * Transition state.
     */
    private transitionState;
}
//# sourceMappingURL=user-agent.d.ts.map