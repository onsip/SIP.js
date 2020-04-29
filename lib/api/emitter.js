"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Creates an {@link Emitter}.
 * @param eventEmitter - An event emitter.
 * @param eventName - Event name.
 * @internal
 */
function _makeEmitter(eventEmitter, eventName) {
    if (eventName === void 0) { eventName = "event"; }
    return {
        addListener: function (listener, options) {
            if (options === void 0) { options = {}; }
            if (options.once) {
                eventEmitter.once(eventName, listener);
            }
            else {
                eventEmitter.addListener(eventName, listener);
            }
        },
        removeListener: function (listener) {
            eventEmitter.removeListener(eventName, listener);
        },
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
exports._makeEmitter = _makeEmitter;
