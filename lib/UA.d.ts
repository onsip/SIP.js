/// <reference types="node" />
import { EventEmitter } from "events";
import { ClientContext } from "./ClientContext";
import { C as SIPConstants } from "./Constants";
import { DigestAuthentication, IncomingRequestMessage, IncomingSubscribeRequest, Logger, LoggerFactory, URI, UserAgentCore, UserAgentCoreConfiguration } from "./core";
import { TypeStrings, UAStatus } from "./Enums";
import { PublishContext } from "./PublishContext";
import { ReferServerContext } from "./ReferContext";
import { InviteClientContext, InviteServerContext } from "./Session";
import { SessionDescriptionHandlerModifiers } from "./session-description-handler";
import { SessionDescriptionHandlerFactory, SessionDescriptionHandlerFactoryOptions } from "./session-description-handler-factory";
import { Subscription } from "./Subscription";
import { Transport } from "./Transport";
export declare namespace UA {
    interface Options {
        uri?: string | URI;
        allowLegacyNotifications?: boolean;
        allowOutOfDialogRefers?: boolean;
        authenticationFactory?: (ua: UA) => DigestAuthentication | any;
        authorizationUser?: string;
        autostart?: boolean;
        autostop?: boolean;
        displayName?: string;
        dtmfType?: DtmfType;
        experimentalFeatures?: boolean;
        extraSupported?: Array<string>;
        forceRport?: boolean;
        hackIpInContact?: boolean;
        hackAllowUnregisteredOptionTags?: boolean;
        hackViaTcp?: boolean;
        hackWssInTransport?: boolean;
        hostportParams?: any;
        log?: {
            builtinEnabled: boolean;
            level?: string | number;
            connector?: (level: string, category: string, label: string | undefined, content: any) => void;
        };
        noAnswerTimeout?: number;
        password?: string;
        register?: boolean;
        registerOptions?: RegisterOptions;
        rel100?: SIPConstants.supported;
        replaces?: SIPConstants.supported;
        sessionDescriptionHandlerFactory?: SessionDescriptionHandlerFactory;
        sessionDescriptionHandlerFactoryOptions?: SessionDescriptionHandlerFactoryOptions;
        sipjsId?: string;
        transportConstructor?: new (logger: any, options: any) => Transport;
        transportOptions?: any;
        userAgentString?: string;
        usePreloadedRoute?: boolean;
        viaHost?: string;
    }
    interface RegisterOptions {
        expires?: number;
        extraContactHeaderParams?: Array<string>;
        instanceId?: string;
        params?: any;
        regId?: number;
        registrar?: string;
    }
}
/**
 * @class Class creating a SIP User Agent.
 * @param {function returning SIP.sessionDescriptionHandler} [configuration.sessionDescriptionHandlerFactory]
 *  A function will be invoked by each of the UA's Sessions to build the sessionDescriptionHandler for that Session.
 *  If no (or a falsy) value is provided, each Session will use a default (WebRTC) sessionDescriptionHandler.
 */
export declare class UA extends EventEmitter {
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
    type: TypeStrings;
    configuration: UA.Options;
    applicants: {
        [id: string]: InviteClientContext;
    };
    publishers: {
        [id: string]: PublishContext;
    };
    contact: {
        pubGruu: URI | undefined;
        tempGruu: URI | undefined;
        uri: URI;
        toString: (options?: any) => string;
    };
    status: UAStatus;
    transport: Transport;
    sessions: {
        [id: string]: InviteClientContext | InviteServerContext;
    };
    subscriptions: {
        [id: string]: Subscription;
    };
    data: any;
    logger: Logger;
    userAgentCore: UserAgentCore;
    private log;
    private error;
    private registerContext;
    /** Unload listener. */
    private unloadListener;
    constructor(configuration?: UA.Options);
    register(options?: any): this;
    /**
     * Unregister.
     *
     * @param {Boolean} [all] unregister all user bindings.
     *
     */
    unregister(options?: any): this;
    isRegistered(): boolean;
    /**
     * Make an outgoing call.
     *
     * @param {String} target
     * @param {Object} views
     * @param {Object} [options.media] gets passed to SIP.sessionDescriptionHandler.getDescription as mediaHint
     *
     * @throws {TypeError}
     *
     */
    invite(target: string | URI, options?: InviteClientContext.Options, modifiers?: SessionDescriptionHandlerModifiers): InviteClientContext;
    subscribe(target: string | URI, event: string, options: any): Subscription;
    /**
     * Send PUBLISH Event State Publication (RFC3903)
     *
     * @param {String} target
     * @param {String} event
     * @param {String} body
     * @param {Object} [options]
     *
     * @throws {SIP.Exceptions.MethodParameterError}
     */
    publish(target: string | URI, event: string, body: string, options: any): PublishContext;
    /**
     * Send a message.
     *
     * @param {String} target
     * @param {String} body
     * @param {Object} [options]
     *
     * @throws {TypeError}
     */
    message(target: string | URI, body: string, options?: any): ClientContext;
    request(method: string, target: string | URI, options?: any): ClientContext;
    /**
     * Gracefully close.
     */
    stop(): this;
    /**
     * Connect to the WS server if status = STATUS_INIT.
     * Resume UA after being closed.
     *
     */
    start(): this;
    /**
     * Normalize a string into a valid SIP request URI
     *
     * @param {String} target
     *
     * @returns {SIP.URI|undefined}
     */
    normalizeTarget(target: string | URI): URI | undefined;
    getLogger(category: string, label?: string): Logger;
    getLoggerFactory(): LoggerFactory;
    getSupportedResponseOptions(): Array<string>;
    /**
     * Get the session to which the request belongs to, if any.
     * @param {SIP.IncomingRequest} request.
     * @returns {SIP.OutgoingSession|SIP.IncomingSession|undefined}
     */
    findSession(request: IncomingRequestMessage): InviteClientContext | InviteServerContext | undefined;
    on(name: "invite", callback: (session: InviteServerContext) => void): this;
    on(name: "inviteSent", callback: (session: InviteClientContext) => void): this;
    on(name: "outOfDialogReferRequested", callback: (context: ReferServerContext) => void): this;
    on(name: "transportCreated", callback: (transport: Transport) => void): this;
    on(name: "message", callback: (message: any) => void): this;
    on(name: "notify", callback: (request: any) => void): this;
    on(name: "subscribe", callback: (subscribe: IncomingSubscribeRequest) => void): this;
    on(name: "registered", callback: (response?: any) => void): this;
    on(name: "unregistered" | "registrationFailed", callback: (response?: any, cause?: any) => void): this;
    private onTransportError;
    /**
     * Helper function. Sets transport listeners
     */
    private setTransportListeners;
    /**
     * Transport connection event.
     * @event
     * @param {SIP.Transport} transport.
     */
    private onTransportConnected;
    /**
     * Handle SIP message received from the transport.
     * @param messageString The message.
     */
    private onTransportReceiveMsg;
    private checkAuthenticationFactory;
    /**
     * Configuration load.
     * returns {void}
     */
    private loadConfig;
    /**
     * Configuration checker.
     * @return {Boolean}
     */
    private getConfigurationCheck;
}
export declare namespace UA {
    enum DtmfType {
        RTP = "rtp",
        INFO = "info"
    }
}
/**
 * Factory function to generate configuration give a UA.
 * @param ua UA
 */
export declare function makeUserAgentCoreConfigurationFromUA(ua: UA): UserAgentCoreConfiguration;
//# sourceMappingURL=UA.d.ts.map