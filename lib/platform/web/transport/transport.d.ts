import { Emitter } from "../../../api/emitter";
import { Transport as TransportDefinition } from "../../../api/transport";
import { TransportState } from "../../../api/transport-state";
import { Logger } from "../../../core";
import { TransportOptions } from "./transport-options";
/**
 * Transport for SIP over secure WebSocket (WSS).
 * @public
 */
export declare class Transport implements TransportDefinition {
    private static defaultOptions;
    onConnect: (() => void) | undefined;
    onDisconnect: ((error?: Error) => void) | undefined;
    onMessage: ((message: string) => void) | undefined;
    private _protocol;
    private _state;
    private _stateEventEmitter;
    private _ws;
    private configuration;
    private connectPromise;
    private connectResolve;
    private connectReject;
    private connectTimeout;
    private disconnectPromise;
    private disconnectResolve;
    private disconnectReject;
    private keepAliveInterval;
    private keepAliveDebounceTimeout;
    private logger;
    private transitioningState;
    constructor(logger: Logger, options?: TransportOptions);
    dispose(): Promise<void>;
    /**
     * The protocol.
     *
     * @remarks
     * Formatted as defined for the Via header sent-protocol transport.
     * https://tools.ietf.org/html/rfc3261#section-20.42
     */
    get protocol(): string;
    /**
     * The URL of the WebSocket Server.
     */
    get server(): string;
    /**
     * Transport state.
     */
    get state(): TransportState;
    /**
     * Transport state change emitter.
     */
    get stateChange(): Emitter<TransportState>;
    /**
     * The WebSocket.
     */
    get ws(): WebSocket | undefined;
    /**
     * Connect to network.
     * Resolves once connected. Otherwise rejects with an Error.
     */
    connect(): Promise<void>;
    /**
     * Disconnect from network.
     * Resolves once disconnected. Otherwise rejects with an Error.
     */
    disconnect(): Promise<void>;
    /**
     * Returns true if the `state` equals "Connected".
     * @remarks
     * This is equivalent to `state === TransportState.Connected`.
     */
    isConnected(): boolean;
    /**
     * Sends a message.
     * Resolves once message is sent. Otherwise rejects with an Error.
     * @param message - Message to send.
     */
    send(message: string): Promise<void>;
    private _connect;
    private _disconnect;
    private _send;
    /**
     * WebSocket "onclose" event handler.
     * @param ev - Event.
     */
    private onWebSocketClose;
    /**
     * WebSocket "onerror" event handler.
     * @param ev - Event.
     */
    private onWebSocketError;
    /**
     * WebSocket "onmessage" event handler.
     * @param ev - Event.
     */
    private onWebSocketMessage;
    /**
     * WebSocket "onopen" event handler.
     * @param ev - Event.
     */
    private onWebSocketOpen;
    /**
     * Helper function to generate an Error.
     * @param state - State transitioning to.
     */
    private transitionLoopDetectedError;
    /**
     * Transition transport state.
     * @internal
     */
    private transitionState;
    private clearKeepAliveTimeout;
    /**
     * Send a keep-alive (a double-CRLF sequence).
     */
    private sendKeepAlive;
    /**
     * Start sending keep-alives.
     */
    private startSendingKeepAlives;
    /**
     * Stop sending keep-alives.
     */
    private stopSendingKeepAlives;
}
//# sourceMappingURL=transport.d.ts.map