/// <reference types="node" />
import { EventEmitter } from "events";
import { Logger } from "./log";
/**
 * Transport
 * @remarks
 * Abstract transport layer base class.
 * @param logger - Logger.
 * @param options - Options bucket.
 * @public
 */
export declare abstract class Transport extends EventEmitter {
    server: any;
    protected logger: Logger;
    constructor(logger: Logger, options: any);
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
     * @param msg - Message.
     * @param options - Options bucket.
     */
    send(msg: string, options?: any): Promise<void>;
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
     * Called by send, must return a promise
     * promise must resolve to an object. object supports 2 parameters: msg - string (mandatory)
     * and overrideEvent - Boolean (optional)
     * @param msg - Message.
     * @param options - Options bucket.
     */
    protected abstract sendPromise(msg: string, options?: any): Promise<any>;
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
