export interface TransportOptions {
    /** URLs of one or more WebSocket servers to connect with. */
    wsServers: Array<string> | string;
    connectionTimeout?: number;
    maxReconnectionAttempts?: number;
    reconnectionTimeout?: number;
    keepAliveInterval?: number;
    keepAliveDebounce?: number;
    traceSip?: boolean;
}
//# sourceMappingURL=transport-options.d.ts.map