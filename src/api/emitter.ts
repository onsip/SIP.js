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
export function makeEmitter<T>(eventEmitter: EventEmitter, eventName: string = "event"): Emitter<T> {
  return {
    on: (listener: (data: T) => void): void => {
      eventEmitter.on(eventName, listener);
    },
    off: (listener: (data: T) => void): void => {
      eventEmitter.removeListener(eventName, listener);
    },
    once: (listener: (data: T) => void): void => {
      eventEmitter.once(eventName, listener);
    }
  };
}
