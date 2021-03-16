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
 * An {@link Emitter} implementation.
 * @internal
 */
export declare class EmitterImpl<T> implements Emitter<T> {
    private listeners;
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
     * Emit change.
     * @param data - Data to emit.
     */
    emit(data: T): void;
    /**
     * Removes all listeners previously registered with addListener.
     */
    removeAllListeners(): void;
    /**
     * Removes a listener previously registered with addListener.
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
//# sourceMappingURL=emitter.d.ts.map