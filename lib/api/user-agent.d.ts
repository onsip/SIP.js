/// <reference types="node" />
import { EventEmitter } from "events";
import { Contact, IncomingRequestMessage, IncomingSubscribeRequest, Logger, LoggerFactory, Transport, URI, UserAgentCore } from "../core";
import { UAStatus } from "../Enums";
import { Invitation } from "./invitation";
import { Inviter } from "./inviter";
import { InviterOptions } from "./inviter-options";
import { Publisher } from "./publisher";
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
export declare class UserAgent extends EventEmitter {
    /** @internal */
    static readonly C: {
        STATUS_INIT: number;
        STATUS_STARTING: number;
        STATUS_READY: number;
        STATUS_USER_CLOSED: number;
        STATUS_NOT_READY: number;
        CONFIGURATION_ERROR: number;
        NETWORK_ERROR: number;
        ALLOWED_METHODS: string[];
        ACCEPTED_BODY_TYPES: string[];
        MAX_FORWARDS: number;
        TAG_LENGTH: number;
    };
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
    sessions: {
        [id: string]: Session;
    };
    /** @internal */
    subscriptions: {
        [id: string]: Subscription;
    };
    /** @internal */
    status: UAStatus;
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
    private error;
    /** Unload listener. */
    private unloadListener;
    /**
     * Constructs a new instance of the `UserAgent` class.
     * @param options - Options bucket. See {@link UserAgentOptions} for details.
     */
    constructor(options?: UserAgentOptions);
    /**
     * User agent configuration.
     */
    readonly configuration: Required<UserAgentOptions>;
    /**
     * Normalize a string into a valid SIP request URI.
     * @param target - The target.
     */
    makeTargetURI(target: string): URI | undefined;
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
    /** @internal */
    on(name: "invite", callback: (session: Invitation) => void): this;
    /** @internal */
    on(name: "outOfDialogReferRequested", callback: (context: any) => void): this;
    /** @internal */
    on(name: "message", callback: (message: any) => void): this;
    /** @internal */
    on(name: "notify", callback: (request: any) => void): this;
    /** @internal */
    on(name: "subscribe", callback: (subscribe: IncomingSubscribeRequest) => void): this;
    /** @internal */
    on(name: "registered", callback: (response?: any) => void): this;
    /** @internal */
    on(name: "unregistered" | "registrationFailed", callback: (response?: any, cause?: any) => void): this;
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