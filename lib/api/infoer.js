"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var session_state_1 = require("./session-state");
/**
 * An Infoer sends {@link Info} (outgoing INFO).
 * @remarks
 * Sends an outgoing in dialog INFO request.
 * @public
 */
var Infoer = /** @class */ (function () {
    /**
     * Constructs a new instance of the `Infoer` class.
     * @param session - The session the INFO will be sent from. See {@link Session} for details.
     * @param options - An options bucket.
     */
    function Infoer(session, options) {
        this.logger = session.userAgent.getLogger("sip.Infoer");
        this._session = session;
    }
    Object.defineProperty(Infoer.prototype, "session", {
        /** The Infoer session. */
        get: function () {
            return this._session;
        },
        enumerable: true,
        configurable: true
    });
    /**
     * Sends the INFO request.
     * @param options - {@link InfoerInfoOptions} options bucket.
     */
    Infoer.prototype.info = function (options) {
        if (options === void 0) { options = {}; }
        // guard session state
        if (this.session.state !== session_state_1.SessionState.Established) {
            var message = "Infoer.info() may only be called if established session.";
            this.logger.error(message);
            return Promise.reject(new Error("Invalid session state " + this.session.state));
        }
        return this.session._info(options.requestDelegate, options.requestOptions);
    };
    return Infoer;
}());
exports.Infoer = Infoer;
