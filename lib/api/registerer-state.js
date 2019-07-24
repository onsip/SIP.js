"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * {@link Registerer} state.
 * @remarks
 * Valid state transitions:
 * ```
 * 1. "initial" --> "registered"
 * 2. "initial" --> "unregistered"
 * 3. "registered" --> "unregistered"
 * 3. "unregistered" --> "registered"
 * ```
 * @public
 */
var RegistererState;
(function (RegistererState) {
    RegistererState["Initial"] = "Initial";
    RegistererState["Registered"] = "Registered";
    RegistererState["Unregistered"] = "Unregistered";
})(RegistererState = exports.RegistererState || (exports.RegistererState = {}));
