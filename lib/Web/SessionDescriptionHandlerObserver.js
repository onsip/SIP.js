"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
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
        this.session.emit("trackAdded");
    };
    SessionDescriptionHandlerObserver.prototype.directionChanged = function () {
        this.session.emit("directionChanged");
    };
    return SessionDescriptionHandlerObserver;
}());
exports.SessionDescriptionHandlerObserver = SessionDescriptionHandlerObserver;
