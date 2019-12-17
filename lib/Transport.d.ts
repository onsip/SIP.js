/// <reference types="node" />
import { EventEmitter } from "events";
import { Logger, Transport as CoreTransport } from "./core";
/**
 * Legacy Transport.
 * @remarks
 * Abstract transport layer base class.
 * @public
 */
export declare abstract class Transport extends EventEmitter implements CoreTransport {
    /**
     * FIXME: This needs to be reworked.
     * Some transport configuration which is controlling core behavior.
     * @internal
     */
    server?: {
        scheme?: string;
        sipUri?: string;
    };
    /**
     * The protocol.
     *
     * @remarks
     * Formatted as defined for the Via header sent-protocol transport.
     * https://tools.ietf.org/html/rfc3261#section-20.42
     */
    readonly protocol: string;
    protected logger: Logger;
    /**
     * Constructor
     * @param logger - Logger.
     * @param options - Options bucket. Deprecated.
     */
    constructor(logger: Logger, options?: any);
    /**
     * Returns the promise designated by the child layer then emits a connected event.
     * Automatically emits an event upon resolution, unless overrideEvent is set. If you
     * override the event in this fashion, you should emit it in your implementation of connectPromise
     * @param options - Options bucket.
     */
    connect(options?: any): Promise<void>;
    /**
     * Returns true if the transport is connected
     */
    abstract isConnected(): boolean;
    /**
     * Sends a message then emits a 'messageSent' event. Automatically emits an
     * event upon resolution, unless data.overrideEvent is set. If you override
     * the event in this fashion, you should emit it in your implementation of sendPromise
     * Rejects with an Error if message fails to send.
     * @param message - Message.
     * @param options - Options bucket.
     */
    send(message: string, options?: any): Promise<void>;
    /**
     * Returns the promise designated by the child layer then emits a
     * disconnected event. Automatically emits an event upon resolution,
     * unless overrideEvent is set. If you override the event in this fashion,
     * you should emit it in your implementation of disconnectPromise
     * @param options - Options bucket
     */
    disconnect(options?: any): Promise<void>;
    afterConnected(callback: () => void): void;
    /**
     * Returns a promise which resolves once the UA is connected. DEPRECATION WARNING: just use afterConnected()
     */
    waitForConnected(): Promise<void>;
    /**
     * Called by connect, must return a promise
     * promise must resolve to an object. object supports 1 parameter: overrideEvent - Boolean
     * @param options - Options bucket.
     */
    protected abstract connectPromise(options: any): Promise<any>;
    /**
     * Called by send.
     * @param message - Message.
     * @param options - Options bucket.
     */
    protected abstract sendPromise(message: string, options?: any): Promise<{
        msg: string;
        overrideEvent?: boolean;
    }>;
    /**
     * Called by disconnect, must return a promise
     * promise must resolve to an object. object supports 1 parameter: overrideEvent - Boolean
     * @param options - Options bucket.
     */
    protected abstract disconnectPromise(options: any): Promise<any>;
    /**
     * To be called when a message is received
     * @param e - Event
     */
    protected abstract onMessage(e: any): void;
}
//# sourceMappingURL=Transport.d.ts.map