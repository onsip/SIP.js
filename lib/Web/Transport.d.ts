import { Logger } from "../core";
import { TypeStrings } from "../Enums";
import { Transport as TransportBase } from "../Transport";
export declare enum TransportStatus {
    STATUS_CONNECTING = 0,
    STATUS_OPEN = 1,
    STATUS_CLOSING = 2,
    STATUS_CLOSED = 3
}
export interface WsServer {
    scheme: string;
    sipUri: string;
    wsUri: string;
    weight: number;
    isError: boolean;
}
export interface Configuration {
    wsServers: Array<WsServer>;
    connectionTimeout: number;
    maxReconnectionAttempts: number;
    reconnectionTimeout: number;
    keepAliveInterval: number;
    keepAliveDebounce: number;
    traceSip: boolean;
}
/**
 * @class Transport
 * @param {Object} options
 */
export declare class Transport extends TransportBase {
    static readonly C: typeof TransportStatus;
    type: TypeStrings;
    server: WsServer;
    ws: WebSocket | undefined;
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
    constructor(logger: Logger, options?: any);
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
    /**
     * Configuration load.
     * returns {Configuration}
     */
    private loadConfig;
    /**
     * Configuration checker.
     * @return {Boolean}
     */
    private getConfigurationCheck;
}
//# sourceMappingURL=Transport.d.ts.map