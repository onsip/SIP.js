/// <reference types="node" />
import { EventEmitter } from "events";
/**
 * Generic observable.
 * @public
 */
export interface Emitter<T> {
    /**
     * Registers a listener.
     * @param listener - Callback function.
     */
    on(listener: (data: T) => void): void;
    /**
     * Unregisters a listener.
     * @param listener - Callback function.
     */
    off(listener: (data: T) => void): void;
    /**
     * Registers a listener then unregisters the listener after one event emission.
     * @param listener - Callback function.
     */
    once(listener: (data: T) => void): void;
}
/**
 * Creates an {@link Emitter}.
 * @param eventEmitter - An event emitter.
 * @param eventName - Event name.
 * @internal
 */
export declare function makeEmitter<T>(eventEmitter: EventEmitter, eventName?: string): Emitter<T>;
//# sourceMappingURL=emitter.d.ts.map