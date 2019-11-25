"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var session_1 = require("../api/session");
var Enums_1 = require("../Enums");
/* SessionDescriptionHandlerObserver
 * @class SessionDescriptionHandler Observer Class.
 * @param {SIP.Session} session
 * @param {Object} [options]
 */
var SessionDescriptionHandlerObserver = /** @class */ (function () {
    function SessionDescriptionHandlerObserver(session, options) {
        this.type = Enums_1.TypeStrings.SessionDescriptionHandlerObserver;
        this.session = session;
        this.options = options;
    }
    SessionDescriptionHandlerObserver.prototype.trackAdded = function () {
        if (this.session instanceof session_1.Session) {
            return;
        }
        this.session.emit("trackAdded");
    };
    SessionDescriptionHandlerObserver.prototype.directionChanged = function () {
        if (this.session instanceof session_1.Session) {
            return;
        }
        this.session.emit("directionChanged");
    };
    return SessionDescriptionHandlerObserver;
}());
exports.SessionDescriptionHandlerObserver = SessionDescriptionHandlerObserver;
