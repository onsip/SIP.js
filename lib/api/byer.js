"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var invitation_1 = require("./invitation");
var session_state_1 = require("./session-state");
/**
 * A byer ends a {@link Session} (outgoing BYE).
 * @remarks
 * Sends an outgoing in dialog BYE request.
 * @public
 */
var Byer = /** @class */ (function () {
    /**
     * Constructs a new instance of the `Byer` class.
     * @param session - The session the BYE will be sent from. See {@link Session} for details.
     * @param options - An options bucket. See {@link ByerOptions} for details.
     */
    function Byer(session, options) {
        this._session = session;
    }
    Object.defineProperty(Byer.prototype, "session", {
        /** The byer session. */
        get: function () {
            return this._session;
        },
        enumerable: true,
        configurable: true
    });
    /**
     * Sends the BYE request.
     * @param options - {@link ByerByeOptions} options bucket.
     */
    Byer.prototype.bye = function (options) {
        if (options === void 0) { options = {}; }
        // guard session state
        if (this.session.state !== session_state_1.SessionState.Established &&
            this.session.state !== session_state_1.SessionState.Terminating) {
            var message = "Byer.bye() may only be called if established session.";
            if (this.session.state === session_state_1.SessionState.Terminated) {
                message += " However this session is already terminated.";
            }
            else {
                if (this.session instanceof invitation_1.Invitation) {
                    message += " However Invitation.accept() has not yet been called.";
                    message += " Perhaps you should have called Invitation.reject()?";
                }
                else {
                    message += " However a dialog does not yet exist.";
                    message += " Perhaps you should have called Inviter.cancel()?";
                }
            }
            this.session.logger.error(message);
            return Promise.reject(new Error("Invalid session state " + this.session.state));
        }
        return this.session._bye(options.requestDelegate, options.requestOptions);
    };
    return Byer;
}());
exports.Byer = Byer;
