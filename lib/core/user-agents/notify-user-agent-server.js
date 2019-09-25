"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var transactions_1 = require("../transactions");
var user_agent_server_1 = require("./user-agent-server");
/**
 * NOTIFY UAS.
 * @public
 */
var NotifyUserAgentServer = /** @class */ (function (_super) {
    tslib_1.__extends(NotifyUserAgentServer, _super);
    /**
     * NOTIFY UAS constructor.
     * @param dialogOrCore - Dialog for in dialog NOTIFY, UserAgentCore for out of dialog NOTIFY (deprecated).
     * @param message - Incoming NOTIFY request message.
     */
    function NotifyUserAgentServer(dialogOrCore, message, delegate) {
        var _this = this;
        var userAgentCore = instanceOfDialog(dialogOrCore) ?
            dialogOrCore.userAgentCore :
            dialogOrCore;
        _this = _super.call(this, transactions_1.NonInviteServerTransaction, userAgentCore, message, delegate) || this;
        return _this;
    }
    return NotifyUserAgentServer;
}(user_agent_server_1.UserAgentServer));
exports.NotifyUserAgentServer = NotifyUserAgentServer;
function instanceOfDialog(object) {
    return object.userAgentCore !== undefined;
}
