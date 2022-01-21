/**
 * {@link Publisher} state.
 * @remarks
 * The {@link Publisher} behaves in a deterministic manner according to the following
 * Finite State Machine (FSM).
 * ```txt
 *                  __________________________________________
 *                 |  __________________________              |
 * Publisher       | |                          v             v
 * Constructed -> Initial -> Published -> Unpublished -> Terminated
 *                              |   ^____________|             ^
 *                              |______________________________|
 * ```
 * @public
 */
export var PublisherState;
(function (PublisherState) {
    PublisherState["Initial"] = "Initial";
    PublisherState["Published"] = "Published";
    PublisherState["Unpublished"] = "Unpublished";
    PublisherState["Terminated"] = "Terminated";
})(PublisherState || (PublisherState = {}));
