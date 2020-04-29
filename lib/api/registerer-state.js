"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * {@link Registerer} state.
 * @remarks
 * The {@link Registerer} behaves in a deterministic manner according to the following
 * Finite State Machine (FSM).
 * ```txt
 *                   __________________________________________
 *                  |  __________________________              |
 * Registerer       | |                          v             v
 * Constructed -> Initial -> Registered -> Unregistered -> Terminated
 *                              |   ^____________|             ^
 *                              |______________________________|
 * ```
 * @public
 */
var RegistererState;
(function (RegistererState) {
    RegistererState["Initial"] = "Initial";
    RegistererState["Registered"] = "Registered";
    RegistererState["Unregistered"] = "Unregistered";
    RegistererState["Terminated"] = "Terminated";
})(RegistererState = exports.RegistererState || (exports.RegistererState = {}));
