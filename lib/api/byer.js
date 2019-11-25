"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var invitation_1 = require("./invitation");
var inviter_1 = require("./inviter");
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
        this.logger = session.userAgent.getLogger("sip.Byer");
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
        var message = "Byer.bye() may only be called if established session.";
        switch (this.session.state) {
            case session_state_1.SessionState.Initial:
                if (this.session instanceof inviter_1.Inviter) {
                    message += " However Inviter.invite() has not yet been called.";
                    message += " Perhaps you should have called Inviter.cancel()?";
                }
                else if (this.session instanceof invitation_1.Invitation) {
                    message += " However Invitation.accept() has not yet been called.";
                    message += " Perhaps you should have called Invitation.reject()?";
                }
                break;
            case session_state_1.SessionState.Establishing:
                if (this.session instanceof inviter_1.Inviter) {
                    message += " However a dialog does not yet exist.";
                    message += " Perhaps you should have called Inviter.cancel()?";
                }
                else if (this.session instanceof invitation_1.Invitation) {
                    message += " However Invitation.accept() has not yet been called (or not yet resolved).";
                    message += " Perhaps you should have called Invitation.reject()?";
                }
                break;
            case session_state_1.SessionState.Established:
                return this.session._bye(options.requestDelegate, options.requestOptions);
            case session_state_1.SessionState.Terminating:
                message += " However this session is already terminating.";
                if (this.session instanceof inviter_1.Inviter) {
                    message += " Perhaps you have already called Inviter.cancel()?";
                }
                else if (this.session instanceof invitation_1.Invitation) {
                    message += " Perhaps you have already called Byer.bye()?";
                }
                break;
            case session_state_1.SessionState.Terminated:
                message += " However this session is already terminated.";
                break;
            default:
                throw new Error("Unknown state");
        }
        this.logger.error(message);
        return Promise.reject(new Error("Invalid session state " + this.session.state));
    };
    return Byer;
}());
exports.Byer = Byer;
