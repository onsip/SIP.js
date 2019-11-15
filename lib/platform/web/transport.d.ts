import { Logger, Transport as TransportBase } from "../../core";
import { TransportOptions } from "./transport-options";
/**
 * FIXME: See below.
 * @internal
 */
interface WebSocketServer {
    /**
     * FIXME
     * This "scheme" currently dictates what gets written into the
     * the Via header in ClientTransaction and InviteClientTransaction.
     */
    scheme: string;
    /**
     * FIXME
     * This "sipUri" currently dictates what gets set in the route set
     * of an outgoing request in OutgoingRequestMessage if the UserAgent
     * is configured with preloaded route set is enabled.
     */
    sipUri: string;
    /**
     * The URI of the WebSocket Server.
     */
    wsUri: string;
    /**
     * FIXME
     * This "weight" is used in order servers to try.
     */
    weight: number;
    /**
     * FIXME
     * Used to keep track if this server is in an error state.
     */
    isError: boolean;
}
export declare enum TransportStatus {
    STATUS_CONNECTING = 0,
    STATUS_OPEN = 1,
    STATUS_CLOSING = 2,
    STATUS_CLOSED = 3
}
/**
 * Transport
 */
export declare class Transport extends TransportBase {
    static readonly C: typeof TransportStatus;
    private static defaultOptions;
    server: WebSocketServer;
    ws: WebSocket | undefined;
    private servers;
    private connectionPromise;
    private connectDeferredResolve;
    private connectDeferredReject;
    private connectionTimeout;
    private disconnectionPromise;
    private disconnectDeferredResolve;
    private reconnectionAttempts;
    private reconnectTimer;
    private keepAliveInterval;
    private keepAliveDebounceTimeout;
    private status;
    private configuration;
    private boundOnOpen;
    private boundOnMessage;
    private boundOnClose;
    private boundOnError;
    constructor(logger: Logger, options: TransportOptions);
    /**
     * @returns {Boolean}
     */
    isConnected(): boolean;
    /**
     * Send a message.
     * @param message - Outgoing message.
     * @param options - Options bucket.
     */
    protected sendPromise(message: string, options?: any): Promise<{
        msg: string;
    }>;
    /**
     * Disconnect socket.
     */
    protected disconnectPromise(options?: any): Promise<any>;
    /**
     * Connect socket.
     */
    protected connectPromise(options?: any): Promise<any>;
    /**
     * @event
     * @param {event} e
     */
    protected onMessage(e: any): void;
    /**
     * @event
     * @param {event} e
     */
    private onOpen;
    /**
     * @event
     * @param {event} e
     */
    private onClose;
    /**
     * Removes event listeners and clears the instance ws
     */
    private disposeWs;
    /**
     * @event
     * @param {string} e
     */
    private onError;
    /**
     * @event
     * @private
     */
    private onWebsocketError;
    /**
     * Reconnection attempt logic.
     */
    private reconnect;
    /**
     * Resets the error state of all servers in the configuration
     */
    private resetServerErrorStatus;
    /**
     * Retrieve the next server to which connect.
     * @param {Boolean} force allows bypass of server error status checking
     * @returns {Object} WsServer
     */
    private getNextWsServer;
    /**
     * Checks all configuration servers, returns true if all of them have isError: true and false otherwise
     * @returns {Boolean}
     */
    private noAvailableServers;
    /**
     * Send a keep-alive (a double-CRLF sequence).
     * @returns {Boolean}
     */
    private sendKeepAlive;
    private clearKeepAliveTimeout;
    /**
     * Start sending keep-alives.
     */
    private startSendingKeepAlives;
    /**
     * Stop sending keep-alives.
     */
    private stopSendingKeepAlives;
    /**
     * Checks given status against instance current status. Returns true if they match
     * @param {Number} status
     * @param {Boolean} [force]
     * @returns {Boolean}
     */
    private statusAssert;
    /**
     * Transitions the status. Checks for legal transition via assertion beforehand
     * @param {Number} status
     * @param {Boolean} [force]
     * @returns {Boolean}
     */
    private statusTransition;
}
export {};
//# sourceMappingURL=transport.d.ts.map