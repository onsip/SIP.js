/**
 * {@link UserAgent} state.
 * @remarks
 * Valid state transitions:
 * ```
 * 1. "Started" --> "Stopped"
 * 2. "Stopped" --> "Started"
 * ```
 * @public
 */
export var UserAgentState;
(function (UserAgentState) {
    UserAgentState["Started"] = "Started";
    UserAgentState["Stopped"] = "Stopped";
})(UserAgentState || (UserAgentState = {}));
