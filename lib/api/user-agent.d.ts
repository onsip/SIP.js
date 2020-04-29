import { Contact, Logger, LoggerFactory, URI, UserAgentCore } from "../core";
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
    /** Default user agent options. */
    private static readonly defaultOptions;
    /**
     * Strip properties with undefined values from options.
     * This is a work around while waiting for missing vs undefined to be addressed (or not)...
     * https://github.com/Microsoft/TypeScript/issues/13195
     * @param options - Options to reduce
     */
    private static stripUndefinedProperties;
    /**
     * Property reserved for use by instance owner.
     * @defaultValue `undefined`
     */
    data: any;
    /**
     * Delegate.
     */
    delegate: UserAgentDelegate | undefined;
    /** @internal */
    _publishers: {
        [id: string]: Publisher;
    };
    /** @internal */
    _registerers: {
        [id: string]: Registerer;
    };
    /** @internal */
    _sessions: {
        [id: string]: Session;
    };
    /** @internal */
    _subscriptions: {
        [id: string]: Subscription;
    };
    private _contact;
    private _state;
    private _stateEventEmitter;
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
     * The logger.
     */
    getLogger(category: string, label?: string): Logger;
    /**
     * The logger factory.
     */
    getLoggerFactory(): LoggerFactory;
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
     * ```txt
     * 1) Sessions terminate.
     * 2) Registerers unregister.
     * 3) Subscribers unsubscribe.
     * 4) Publishers unpublish.
     * 5) Transport disconnects.
     * 6) User Agent Core resets.
     * ```
     * NOTE: While this is a "graceful shutdown", it can also be very slow one if you
     * are waiting for the returned Promise to resolve. The disposal of the clients and
     * dialogs is done serially - waiting on one to finish before moving on to the next.
     * This can be slow if there are lot of subscriptions to unsubscribe for example.
     *
     * THE SLOW PACE IS INTENTIONAL!
     * While one could spin them all down in parallel, this could slam the remote server.
     * It is bad practice to denial of service attack (DoS attack) servers!!!
     * Moreover, production servers will automatically blacklist clients which send too
     * many requests in too short a period of time - dropping any additional requests.
     *
     * If a different approach to disposing is needed, one can implement whatever is
     * needed and execute that prior to calling `stop()`. Alternatively one may simply
     * not wait for the Promise returned by `stop()` to complete.
     */
    stop(): Promise<void>;
    /**
     * Used to avoid circular references.
     * @internal
     */
    _makeInviter(targetURI: URI, options?: InviterOptions): Inviter;
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