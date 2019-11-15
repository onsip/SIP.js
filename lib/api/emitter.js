"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Creates an {@link Emitter}.
 * @param eventEmitter - An event emitter.
 * @param eventName - Event name.
 * @internal
 */
function makeEmitter(eventEmitter, eventName) {
    if (eventName === void 0) { eventName = "event"; }
    return {
        on: function (listener) {
            eventEmitter.on(eventName, listener);
        },
        off: function (listener) {
            eventEmitter.removeListener(eventName, listener);
        },
        once: function (listener) {
            eventEmitter.once(eventName, listener);
        }
    };
}
exports.makeEmitter = makeEmitter;
