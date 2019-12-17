/// <reference types="node" />
import { EventEmitter } from "events";
/**
 * Generic observable.
 * @public
 */
export interface Emitter<T> {
    /**
     * Sets up a function that will be called whenever the target changes.
     * @param listener - Callback function.
     * @param options - An options object that specifies characteristics about the listener.
     *                  If once true, indicates that the listener should be invoked at most once after being added.
     *                  If once true, the listener would be automatically removed when invoked.
     */
    addListener(listener: (data: T) => void, options?: {
        once?: boolean;
    }): void;
    /**
     * Removes from the listener previously registered with addListener.
     * @param listener - Callback function.
     */
    removeListener(listener: (data: T) => void): void;
    /**
     * Registers a listener.
     * @param listener - Callback function.
     * @deprecated Use addListener.
     */
    on(listener: (data: T) => void): void;
    /**
     * Unregisters a listener.
     * @param listener - Callback function.
     * @deprecated Use removeListener.
     */
    off(listener: (data: T) => void): void;
    /**
     * Registers a listener then unregisters the listener after one event emission.
     * @param listener - Callback function.
     * @deprecated Use addListener.
     */
    once(listener: (data: T) => void): void;
}
/**
 * Creates an {@link Emitter}.
 * @param eventEmitter - An event emitter.
 * @param eventName - Event name.
 * @internal
 */
export declare function _makeEmitter<T>(eventEmitter: EventEmitter, eventName?: string): Emitter<T>;
//# sourceMappingURL=emitter.d.ts.map